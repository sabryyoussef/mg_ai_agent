# -*- coding: utf-8 -*-
"""Offline mock LangChain-compatible LLM for demonstrations (no API key / quota)."""

import hashlib
import json
import re

from langchain_core.embeddings import Embeddings
from langchain_core.messages import AIMessage


class DemoChatLLM:
    """Minimal chat model used when Demo Mock provider is selected."""

    def __init__(self, api_key=None, model=None, temperature=0.7, **kwargs):
        self.model = model or "demo-gpt"
        self.temperature = temperature

    def bind(self, **kwargs):
        return self

    def bind_tools(self, tools, **kwargs):
        return self

    def invoke(self, input_text, config=None):
        system_text = ""
        user_text = ""
        messages = input_text if isinstance(input_text, list) else [input_text]
        for msg in messages:
            content = getattr(msg, "content", str(msg))
            if isinstance(msg, AIMessage):
                continue
            msg_type = getattr(msg, "type", None)
            if msg_type == "system" or msg.__class__.__name__ == "SystemMessage":
                system_text = content
            elif msg_type == "human" or msg.__class__.__name__ == "HumanMessage":
                user_text = content
        if not user_text and hasattr(input_text, "content"):
            user_text = input_text.content
        elif not user_text and isinstance(input_text, str):
            user_text = input_text
        return AIMessage(content=self._answer(system_text, user_text))

    def _answer(self, system_text, question):
        question = self._normalize_question(question)
        lower = (question or "").lower()
        if "1+1" in lower or "1 + 1" in lower:
            return "2"
        if "json" in lower and "partner" in lower:
            return '{"partners":[{"name":"demo","email":"demo@example.com"}]}'

        chunks = self._extract_memory_chunks(system_text)
        if chunks:
            reply = self._answer_from_chunks(chunks, question)
            if reply:
                return reply

        return (
            "[Demo Mock LLM] I could not find that in the loaded knowledge base. "
            "Open quest **Demo Chat — Sales & Inventory**, ensure **AI Memory** "
            "records are **Active** with a FAISS index, then ask again. "
            f"(Parsed {len(chunks)} knowledge records from memory.) "
            f"Question: {question[:160]!r}"
        )

    @staticmethod
    def _normalize_question(question):
        if not question:
            return ""
        q = question.strip()
        q = re.sub(r"\s*→\s*.*$", "", q, flags=re.IGNORECASE)
        q = re.sub(r"\s*\(from\s+[^)]*memory\)\s*", " ", q, flags=re.IGNORECASE)
        q = q.strip(" '\"")
        return q

    @staticmethod
    def _extract_memory_chunks(system_text):
        chunks = []
        if not system_text:
            return chunks
        # Each embedded Odoo record is one JSON object (possibly multi-line)
        decoder = json.JSONDecoder()
        idx = 0
        text = system_text
        while idx < len(text):
            start = text.find("{", idx)
            if start < 0:
                break
            try:
                obj, end = decoder.raw_decode(text, start)
                if isinstance(obj, dict):
                    chunks.append(obj)
                idx = end
            except json.JSONDecodeError:
                idx = start + 1
        return chunks

    def _answer_from_chunks(self, chunks, question):
        q = self._normalize_question(question).lower()
        records = [c for c in chunks if isinstance(c, dict)]
        if not records:
            return None

        # Product / SKU codes in question
        code_match = re.search(r"demo[-_][a-z0-9-]+", q, re.I)
        if code_match:
            code = code_match.group(0).lower().replace("_", "-")
            for rec in records:
                if str(rec.get("default_code", "")).lower().replace("_", "-") == code:
                    return self._format_record(rec)

        # Name tokens (steel, bracket, chair, acme, beta, ...)
        tokens = [t for t in re.findall(r"[a-z0-9]{3,}", q) if t not in (
            "demo", "many", "what", "the", "have", "from", "that", "this", "with",
            "how", "much", "total", "amount", "order", "hand", "stock", "inventory",
        )]

        best = None
        best_score = 0
        for rec in records:
            blob = json.dumps(rec, default=str).lower()
            score = sum(1 for t in tokens if t in blob)
            if score > best_score:
                best_score = score
                best = rec
        if best and best_score >= 1:
            return self._format_record(best)

        # Explicit field-based routing
        if any(w in q for w in ("stock", "inventory", "on hand", "quantity", "how many")):
            stock_recs = [r for r in records if "quantity" in r or "qty_available" in r]
            if len(stock_recs) == 1:
                return self._format_record(stock_recs[0])
            for rec in stock_recs:
                name = str(rec.get("name") or rec.get("product_id") or "").lower()
                if any(t in name for t in tokens):
                    return self._format_record(rec)
            if stock_recs:
                return self._format_stock_summary(stock_recs)

        if any(w in q for w in ("sale", "order", "customer", "total", "revenue", "amount")):
            so_recs = [r for r in records if "amount_total" in r]
            for rec in so_recs:
                ref = str(rec.get("client_order_ref", "")).lower()
                if ref and ref in q:
                    return self._format_record(rec)
            if so_recs:
                return self._format_record(so_recs[0])

        if any(w in q for w in ("product", "price", "sku", "list price")):
            prod_recs = [r for r in records if "list_price" in r or "default_code" in r]
            if prod_recs:
                return self._format_record(prod_recs[0])

        return None

    @staticmethod
    def _format_record(rec):
        label = (
            rec.get("name")
            or rec.get("display_name")
            or rec.get("client_order_ref")
            or "Record"
        )
        if isinstance(label, (list, tuple)) and len(label) == 2:
            label = label[1]
        parts = [f"**{label}** (from demo Sales & Inventory knowledge)"]
        for key, val in rec.items():
            if key == "id" or val in (False, None, ""):
                continue
            if isinstance(val, (list, tuple)) and len(val) == 2:
                val = val[1]
            parts.append(f"- {key.replace('_', ' ').title()}: {val}")
        return "\n".join(parts)

    @staticmethod
    def _format_stock_summary(records):
        lines = ["**Stock on hand (demo knowledge)**"]
        for rec in records:
            name = rec.get("name") or rec.get("product_id")
            if isinstance(name, (list, tuple)):
                name = name[1]
            qty = rec.get("qty_available") or rec.get("quantity")
            lines.append(f"- {name}: {qty}")
        return "\n".join(lines)


class DemoEmbeddings(Embeddings):
    """Hash-based embeddings so FAISS similarity works offline."""

    def __init__(self, api_key=None, model=None, **kwargs):
        self.model = model or "demo-embed"

    def _vector(self, text):
        digest = hashlib.sha256((text or "").encode("utf-8")).digest()
        return [((b / 255.0) * 2.0 - 1.0) for b in digest[:32]]

    def embed_query(self, text):
        return self._vector(text)

    def embed_documents(self, texts):
        return [self._vector(t) for t in texts]

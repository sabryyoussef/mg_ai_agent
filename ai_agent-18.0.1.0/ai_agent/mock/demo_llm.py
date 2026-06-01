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
        """LangGraph / create_agent compatibility."""
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
            else:
                user_text = content or user_text
        if not user_text and hasattr(input_text, "content"):
            user_text = input_text.content
        elif not user_text and isinstance(input_text, str):
            user_text = input_text
        return AIMessage(content=self._answer(system_text, user_text))

    def _answer(self, system_text, question):
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
            "Install demo data (Sales & Inventory) and run **Build knowledge** on AI Memory. "
            f"Question: {question[:200]!r}"
        )

    @staticmethod
    def _extract_memory_chunks(system_text):
        chunks = []
        if not system_text:
            return chunks
        for match in re.finditer(r"\{[^{}]*\}", system_text, re.DOTALL):
            raw = match.group(0)
            try:
                chunks.append(json.loads(raw))
            except json.JSONDecodeError:
                continue
        return chunks

    def _answer_from_chunks(self, chunks, question):
        q = (question or "").lower()
        records = [c for c in chunks if isinstance(c, dict)]
        if not records:
            return None

        # Single-record lookups by name / code / reference
        for rec in records:
            name = str(rec.get("name") or rec.get("display_name") or "").lower()
            code = str(rec.get("default_code") or "").lower()
            ref = str(rec.get("client_order_ref") or "").lower()
            if name and name in q:
                return self._format_record(rec, question)
            if code and code in q:
                return self._format_record(rec, question)
            if ref and ref in q:
                return self._format_record(rec, question)

        # Keyword routing
        if any(w in q for w in ("stock", "inventory", "on hand", "quantity", "quant")):
            stock_recs = [r for r in records if "quantity" in r or "qty_available" in r]
            if stock_recs:
                lines = ["From inventory knowledge:"]
                for r in stock_recs[:8]:
                    lines.append(self._format_record(r, question))
                return "\n".join(lines)

        if any(w in q for w in ("sale", "order", "customer", "total", "revenue")):
            so_recs = [r for r in records if "amount_total" in r or "invoice_status" in r]
            if so_recs:
                lines = ["From sales order knowledge:"]
                for r in so_recs[:8]:
                    lines.append(self._format_record(r, question))
                return "\n".join(lines)

        if any(w in q for w in ("product", "price", "sku", "item")):
            prod_recs = [r for r in records if "list_price" in r or "default_code" in r]
            if prod_recs:
                lines = ["From product knowledge:"]
                for r in prod_recs[:8]:
                    lines.append(self._format_record(r, question))
                return "\n".join(lines)

        # Fallback: return best partial match
        for rec in records:
            blob = json.dumps(rec).lower()
            for token in re.findall(r"[a-z0-9]{4,}", q):
                if token in blob:
                    return self._format_record(rec, question)
        return None

    @staticmethod
    def _format_record(rec, question):
        parts = []
        label = rec.get("name") or rec.get("display_name") or rec.get("client_order_ref") or "Record"
        parts.append(f"**{label}** (from demo knowledge)")
        for key, val in rec.items():
            if key in ("id",) or val in (False, None, ""):
                continue
            if isinstance(val, (list, tuple)) and len(val) == 2:
                val = val[1]
            parts.append(f"- {key.replace('_', ' ').title()}: {val}")
        return "\n".join(parts)


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

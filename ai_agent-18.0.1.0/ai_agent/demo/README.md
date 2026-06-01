# AI Agent — Demo data

## Always installed (no demo flag)

**Demo Mock** provider (`data/demo_mock_provider_data.xml`) — offline LLM, no API key or quota.

## Loaded with demo data

`demo/ai_agent_demo_scenarios.xml` creates:

| Item | Init type | Notes |
|------|-----------|--------|
| Demo Mock LLM | — | Status **Confirmed**, Test returns `2` for 1+1 |
| Payroll Demo Assistant | agent | Legacy payroll Q&A |
| Odoo Demo Helper | agent | Technical Odoo help |
| Demo Chat — Odoo Helper | **chat** | Discuss private chat |
| Demo Channel — Team Assistant | **channel** | Shared channel |
| Demo Manual Quest (Draft) | **manual** | Training / activation |
| Demo Mail — Partner Extractor | **mail** | Mock JSON partners |

### Sales & Inventory + AI Memory (RAG)

`demo/ai_agent_sales_inventory_demo.xml` and `demo/ai_agent_sales_inventory_knowledge.xml` (requires **Sales** and **Inventory**):

| Item | Purpose |
|------|---------|
| DEMO partners, products, sale orders | Sample `DEMO-*` catalog |
| Stock on hand | 250 brackets, 45 chairs, 18 desks |
| **AI Memory** (×3) | FAISS index from `product.product`, `sale.order`, `stock.quant` |
| **Sales & Inventory Demo Assistant** | Agent with 3 memories |
| **Demo Chat — Sales & Inventory** | Discuss chat using knowledge only |

**Load on existing database:**

```powershell
Get-Content D:\odoo\odoo18\scripts\setup_ai_agent_sales_inventory_demo.py | `
  .\.venv\Scripts\python.exe odoo18\odoo-bin shell -c odoo_conf\odoo18.conf -d odoo18 --no-http
```

**Example questions** (Discuss → *Demo Chat — Sales & Inventory*):

- How many **DEMO Steel Bracket Kit** do we have on hand?
- What is the total for **DEMO-ACME-2026**?
- What is the list price of **DEMO-PROD-020**?

Answers are built from **AI Memory** chunks (embedded Odoo records), via **Demo Mock** LLM.

## Test mock LLM in Odoo

1. **Configuration** → **LLMs** → **Demo Mock-demo-gpt**
2. Click **Test** → should confirm without OpenAI
3. Open **Demo Chat — Odoo Helper** quest → **Discuss**

## Real OpenAI / Groq

Use **Open-AI** or **Groq** providers with your own API key; demo data does not require them.

## Full user guide

See **[docs/USER_GUIDE.md](../docs/USER_GUIDE.md)** — configuration, API keys, Odoo context, and chat scenarios step by step.

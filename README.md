# MG AI Agent (Odoo 18)

Odoo addons from **Vertel / MG Projects** — AI orchestration for Odoo 18.

## Modules

| Path | Technical name | Description |
|------|----------------|-------------|
| `ai_agent-18.0.1.0/ai_agent` | `ai_agent` | AI Agent orchestration (quests, agents, LLM providers, memory/RAG) |
| `ai_agent-18.0.1.0/web_widget_mermaid_field` | `web_widget_mermaid_field` | Mermaid diagram widget (dependency) |

## Install

1. Add this folder (or `ai_agent-18.0.1.0`) to Odoo `addons_path`.
2. Install **Mermaid Widget**, then **odoo-ai: AI Agent**.
3. Python deps: see `ai_agent/__manifest__.py` → `external_dependencies.python`.
4. Optional demo: install with **Load demonstration data**, or run  
   `scripts/setup_ai_agent_sales_inventory_demo.py` via `odoo-bin shell` (see `ai_agent/demo/README.md`).

## Documentation

- [User guide](ai_agent-18.0.1.0/ai_agent/docs/USER_GUIDE.md)
- [Demo data](ai_agent-18.0.1.0/ai_agent/demo/README.md)
- [UAT screenshots](ai_agent-18.0.1.0/ai_agent/docs/screenshots/user-guide/)

## License

AGPL-3 (see module manifests).

# Sales & Inventory demo chat — Playwright screenshots

Captured by `tests/ai_agent_sales_inventory_chat_uat.spec.ts` after Odoo restart and demo knowledge rebuild.

## Run

```powershell
# 1. Start Odoo
cd D:\odoo\odoo18
.\.venv\Scripts\python.exe .\odoo18\odoo-bin server -c .\odoo_conf\odoo18.conf

# 2. Load / refresh demo (shell)
Get-Content D:\odoo\odoo18\scripts\setup_ai_agent_sales_inventory_demo.py | `
  .\.venv\Scripts\python.exe odoo18\odoo-bin shell -c odoo_conf\odoo18.conf -d odoo18 --no-http

# 3. Playwright
$env:ODOO_URL="http://127.0.0.1:8018"
$env:ODOO_DB="odoo18"
npx playwright test ai_agent_sales_inventory_chat_uat.spec.ts `
  --config=projects/mg_projects/ai_agent-18.0.1.0/ai_agent/tests/playwright.config.ts
```

## Files

| File | Content |
|------|---------|
| `01_after_login.png` | Odoo home |
| `02_ai_memory_list.png` | AI Memory list (DEMO *) |
| `03_ai_memory_products_form.png` | DEMO Products Catalog memory |
| `04_agents_list.png` | Agents list |
| `05_agent_sales_inventory_form.png` | Sales & Inventory Demo Assistant |
| `06_agent_memory_tab.png` | Agent memory links |
| `07_quests_list.png` | Quests |
| `08_quest_sales_inventory_form.png` | Demo Chat — Sales & Inventory quest |
| `09_discuss_inbox.png` | Discuss sidebar |
| `10_discuss_sales_inventory_thread.png` | Chat thread open |
| `11_chat_question_typed.png` | Stock question in composer |
| `12_chat_bot_answer_stock.png` | Bot answer (qty 250 / DEMO-PROD-010) |
| `13_chat_bot_answer_sales_order.png` | Bot answer (DEMO-ACME-2026 total) |

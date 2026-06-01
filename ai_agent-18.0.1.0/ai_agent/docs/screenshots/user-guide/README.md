# AI Agent USER_GUIDE — Playwright screenshots

Captured by `tests/ai_agent_user_guide_uat.spec.ts` following [USER_GUIDE.md](../USER_GUIDE.md).

## Run

```powershell
cd D:\odoo\odoo18
$env:ODOO_URL="http://127.0.0.1:8018"
$env:ODOO_DB="odoo18"
# First time only: npx playwright install chromium
npx playwright test ai_agent_user_guide_uat.spec.ts `
  --config=projects/mg_projects/ai_agent-18.0.1.0/ai_agent/tests/playwright.config.ts
```

Login uses `ODOO_USER` / `ODOO_PASSWORD` (default `admin` / `admin`) via JSON-RPC session.

Requires: Odoo running, `ai_agent` installed, demo data (Demo Mock, demo quests).

Discuss demo threads are created by `ai.quest.setup_demo_discuss_channels()` (runs on demo install).
On an existing database:

```powershell
Get-Content D:\odoo\odoo18\scripts\setup_ai_agent_demo_discuss.py | `
  .\.venv\Scripts\python.exe odoo18\odoo-bin shell -c odoo_conf\odoo18.conf -d odoo18 --no-http
```

## Files

| File | USER_GUIDE section |
|------|-------------------|
| `01_after_login.png` | Login |
| `02_providers_list.png` | §3 Providers |
| `03_provider_demo_mock_form.png` | §3 API key on provider |
| `04_provider_llm_tab_api_key.png` | Provider LLM tab |
| `05_llms_list.png` | §3 LLMs |
| `06_llm_demo_mock_form.png` | §3 Test / Confirm LLM |
| `07_agents_list.png` | §4 Agents |
| `08_agent_form.png` | §4 Agent setup |
| `09_quests_list.png` | §5 Quests |
| `10_quest_demo_chat_form.png` | §5 Quest form |
| `11_quest_context_settings.png` | §5 Odoo context toggles |
| `12_quest_agents_tab.png` | §5 Agents tab |
| `13_ai_orchestration_quests.png` | Menu overview |
| `14_discuss_inbox.png` | §6 Scenario 1 Discuss |
| `15_discuss_demo_chat_thread.png` | §6 Chat thread |
| `16_settings_ai_orchestration.png` | §2.3 Settings |

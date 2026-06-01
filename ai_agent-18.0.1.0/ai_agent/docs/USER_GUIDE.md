# AI Agent — User Guide & Use Case Scenarios

Step-by-step guide from **configuration** and **API keys** through **chatting with users** while the AI uses **Odoo data** in context.

---

## 1. Who does what?

| Role | Tasks |
|------|--------|
| **Administrator** | Install module, add API keys, create providers/LLMs, security groups |
| **AI Supervisor** | Design quests, agents, tools, memory |
| **End user** | Chat in Discuss, use channel quests, trigger server actions |
| **Developer** | Python code on quests, cron, mail parsing |

**Menu:** **AI Orchestration** (main app)

---

## 2. Initial configuration

### 2.1 Install the module

1. **Apps** → remove “Apps” filter → search **AI Agent** (technical name `ai_agent`).
2. Install **odoo-ai: AI Agent** (and dependency **Mermaid Widget**).
3. Restart Odoo after install (JavaScript assets).

### 2.2 Security groups

Assign users in **Settings → Users**:

| Group | Can do |
|-------|--------|
| AI Agent Developer | Configure agents, LLMs, tools |
| AI Agent Manager | Manage agents + quests |
| AI Agent Supervisor | Full configuration (providers, memory, rules) |

### 2.3 Settings (optional)

**AI Orchestration → Configuration → Settings**

- View quest count and open **Manage Quests**.

---

## 3. API keys and LLM providers

The AI calls an external (or mock) model through an **LLM** record linked to a **Provider**.

### Path

**AI Orchestration → Configuration → Providers** → open a provider (e.g. **Open-AI**, **Demo Mock**)

| Field | Purpose |
|-------|---------|
| **AI API Key** | Secret key from the vendor (or dummy for demo) |
| **LLM Library / LLM Class** | Technical link to LangChain (set by module) |
| **Create LLMs** | Button — creates one **LLM** row per model (gpt-4o-mini, etc.) |

Then: **Configuration → LLMs** → open a model → **Test** → status **Confirmed**.

### Option A — Demo (no billing, training)

Use built-in **Demo Mock** (installed with the module):

1. **Providers → Demo Mock** — no real key needed.
2. **Create LLMs** → open **Demo Mock-demo-gpt**.
3. **Test** → should confirm with answer `2` for “1+1”.
4. Use demo quests from [demo/README.md](../demo/README.md).

### Option B — OpenAI (production)

1. Create key at [platform.openai.com](https://platform.openai.com) → **Billing** must have credits.
2. **Providers → Open-AI** → paste key in **AI API Key**.
3. **Create LLMs** → choose **Open-AI-gpt-4o-mini** (cheaper than o3).
4. **Test** → **Confirmed**.
5. Install Python bridge: `pip install langchain_openai` in Odoo venv, restart Odoo.

**Error 429 insufficient_quota:** billing problem on OpenAI, not Odoo. Use **Demo Mock** until credits are added.

### Option C — Server-wide key (`odoo.conf`)

In `odoo_conf/odoo18.conf` (optional fallback):

```ini
openai_api_key = sk-...
```

Used when the LLM record has an empty **AI API Key** (fallback name `openai_api_key` on Open-AI provider).

### Other providers

| Provider | Where to get key |
|----------|------------------|
| Groq | [console.groq.com](https://console.groq.com) + `pip install langchain_groq` |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) + `pip install langchain_anthropic` |
| Ollama (local) | Install [ollama.com](https://ollama.com) — often no cloud key |

---

## 4. Create an Agent (persona + brain)

**AI Orchestration → Agents and Quests → Agents → New**

| Field | Example |
|-------|---------|
| **Name** | Payroll Assistant |
| **LLM** | Demo Mock-demo-gpt or Open-AI-gpt-4o-mini (**must be Confirmed**) |
| **Role** | You help payroll clerks with day works and Odoo Legacy Payroll. |
| **Goal** | Answer clearly using Odoo data context when provided. |
| **Backstory** | Expert on Gulf Enterprises Mixed.exe migration. |
| **Prompt template** | `{message}` |
| **Status** | **Active** (after **Test** succeeds) |

**Object** (optional): link agent to one Odoo record (e.g. a `res.partner`) for reference-style answers.

Click **Test** on the agent before going live.

---

## 5. Create a Quest (how users trigger the AI)

**AI Orchestration → Ai Quest → New**

### Core fields

| Field | Purpose |
|-------|---------|
| **Name** | Display name (e.g. “Payroll Chat Bot”) |
| **Initiate** | How the quest starts (see scenarios below) |
| **Description** | System instructions — main “personality” and rules |
| **Status** | **Draft** → **Active** when ready |
| **Agents** tab | Add one or more agents + their LLM |

### Context from Odoo (fetch data into the prompt)

On the quest form, **Context Settings**:

| Toggle | What Odoo sends to the LLM |
|--------|---------------------------|
| **Use Company Info** | Company mission & values |
| **Use Personal Info** | Current user name, function, city |
| **Use the Users Language** | Answer in user’s language |
| **Use Time Context** | Today’s date, time, week number |

These are appended automatically (`extra_context`) — no API call to “fetch” separately; Odoo reads `res.users` / `res.company` at runtime.

### Bind quest to an Odoo model (records & server actions)

| Field | Use |
|-------|-----|
| **Model** | e.g. `legacy.daywork`, `crm.lead`, `res.partner` |
| **Record Selection** | Domain filter for cron / server-action runs |
| **Has Code** | Advanced: custom Python to `build()` graph and `invoke()` |

For **chat**, binding a model helps when code or agents use `object_id` / session objects.

### Advanced: AI Memory (RAG)

**Configuration → AI Memory** — upload documents/URLs; link memory to agents.  
The LLM can use embedded knowledge (vectors) in addition to live Odoo context.

For a full walkthrough with **Sales**, **Inventory**, and sample **DEMO-*** data, see [§12 Sales & Inventory demo — test the knowledge base](#12-sales--inventory-demo--test-the-knowledge-base).

---

## 6. Use case scenarios (by Initiate type)

### Scenario 1 — Chat with User (1:1 in Discuss)

**Best for:** Personal assistant, payroll Q&A, Odoo help.

| Step | Action |
|------|--------|
| 1 | Quest **Initiate** = **Chat with User** |
| 2 | **Description** = instructions (e.g. “You are a payroll helper for Legacy Mixed…”) |
| 3 | **Agents** tab → add agent with confirmed LLM |
| 4 | **Status** = **Active** → Save (creates bot user) |
| 5 | User opens **Discuss** → conversation with the bot |
| 6 | User sends message → quest runs → reply in thread |

**Odoo data in chat:** Enable **Use Company Info**, **Use Personal Info**, **Use Time Context**.  
Mention in **Description**: “When user asks about day works, explain draft/confirmed/printed states.”

**Demo quest:** *Demo Chat — Odoo Helper* (Demo Mock LLM).

```
User: What is on my company mission?
Bot:  [Uses company_info from res.company in context]

User: How do I confirm a day work in Legacy Payroll?
Bot:  [Uses Description + agent knowledge]
```

---

### Scenario 2 — Chat with Channel (team room)

**Best for:** Team channel, shared support.

| Step | Action |
|------|--------|
| 1 | **Initiate** = **Chat with Channel** |
| 2 | Configure agents + **Active** |
| 3 | Odoo creates/links a **Discuss channel** |
| 4 | Team members post in channel; bot responds |

**Options:** **Use Chat History** + **Chat History Limit** (last N messages).

**Demo quest:** *Demo Channel — Team Assistant*.

---

### Scenario 3 — Mail (email → Odoo data)

**Best for:** Parse incoming email → create/update Odoo records.

| Step | Action |
|------|--------|
| 1 | **Initiate** = **Mail** |
| 2 | Configure **Email Alias** (e.g. `quest-payroll@yourdomain`) |
| 3 | **Python Code** (default pattern) calls `quest.build(...).invoke(...)` |
| 4 | Example: create `res.partner` from sender address |

**Demo quest:** *Demo Mail — Partner Extractor* (mock returns JSON partners).

---

### Scenario 4 — Server Action (on selected records)

**Best for:** “AI summarize this list of leads” from list view.

| Step | Action |
|------|--------|
| 1 | **Initiate** = **Server Action** |
| 2 | **Model** = target model |
| 3 | **Status** = **Active** (registers action on model) |
| 4 | User selects records → **Action** menu → your quest |

Odoo passes **records** into the quest session; code can read fields and post results.

---

### Scenario 5 — Scheduled Action (cron)

**Best for:** Nightly summary, batch checks.

| Step | Action |
|------|--------|
| 1 | **Initiate** = **Scheduled Action** |
| 2 | **Model** + **Record Selection** domain |
| 3 | Set schedule on linked **Scheduled Action** |
| 4 | Cron runs quest code on matching records |

---

### Scenario 6 — Manual

**Best for:** Design/testing before activation.

| Step | Action |
|------|--------|
| 1 | **Initiate** = **Manual** |
| 2 | Keep **Draft** until configuration is complete |
| 3 | Activate when linked agents/LLMs are ready |

---

### Scenario 7 — Supervisor quest (multi-agent)

**Best for:** Complex workflows with multiple agents.

| Step | Action |
|------|--------|
| 1 | Enable **Is Supervisor** on quest |
| 2 | Set **Supervisor LLM** + **Supervisor Prompt** |
| 3 | Add multiple agents on **Agents** tab with sequence |
| 4 | View **Graph** tab (Mermaid) after build |

---

## 7. End-to-end example: Payroll chat with Odoo context

**Goal:** User chats about Legacy Payroll; bot knows company and user.

1. **Provider:** Demo Mock or Open-AI with key.  
2. **LLM:** Confirm **Demo Mock-demo-gpt** or **Open-AI-gpt-4o-mini**.  
3. **Agent:** “Legacy Payroll Assistant” — Active, LLM assigned.  
4. **Quest:**
   - Name: `Legacy Payroll Help`
   - Initiate: **Chat with User**
   - Description:
     ```
     You assist users of Odoo Legacy Payroll (day works, cards, groups accounts).
     Explain workflows: draft → confirm → print for day works.
     If asked about dates, use the current date from context.
     Be concise.
     ```
   - Context: all four toggles ON  
   - Agents: add Legacy Payroll Assistant  
   - Status: **Active**  
5. **Discuss** → open bot chat → ask:  
   *“What steps do I follow to enter today’s day work?”*  
6. Review **AI Orchestration → Configuration → AI Session / Messages** for token usage.

---

## 8. Combining AI Agent + Legacy Payroll data

The AI does **not** automatically SQL-query `legacy.daywork` unless you add **code/tools** or describe records in the session.

**Practical approaches:**

| Approach | How |
|----------|-----|
| **Context toggles** | Company + user + time (built-in) |
| **Description** | Document your Odoo menus and states |
| **Server action quest** | Model = `legacy.daywork`, user selects records, code reads `records` |
| **AI Memory** | Upload payroll handbook PDF for RAG |
| **Agent Object** | Pin one record for focused Q&A |
| **Future custom tool** | Python tool calling `env['legacy.daywork'].search_read(...)` |

**Recommended demo path:** Install `legacy_mixed_system` demo data → ask chat bot process questions while clerks use real screens for data entry.

See [Legacy Payroll user guide](../../../edafa_legacy_project/docs/USER_GUIDE.md).

---

## 9. Monitoring

| Menu | Shows |
|------|--------|
| **AI Session** | Conversation runs |
| **Messages** | Full message log |
| **AI Tokens** | Token usage per LLM/agent |
| **LLMs → stat buttons** | Sessions, costs |

Enable **Debug** on quest/agent for more chatter log detail.

---

## 10. Quick troubleshooting

| Problem | Fix |
|---------|-----|
| LLM Test fails 429 | OpenAI billing; or use **Demo Mock** |
| Could not confirm llm | Install provider pip package; restart Odoo |
| Chat bot missing | Quest **Active** + Initiate **Chat**; save quest again |
| No reply in Discuss | Agent **Active**; LLM **Confirmed** |
| Knowledge chat empty | Wrong Discuss bot — use **Sales & Inventory** quest (§12) |
| `ai.quest` 404 | Restart Odoo after installing `ai_agent` |
| Agent has no LLM in list | Filter requires **Confirmed** non-embedded LLM |

---

## 11. Demo data checklist

- [ ] **Demo Mock** provider → **Create LLMs** → **Test**  
- [ ] Open quest **Demo Chat — Odoo Helper** → **Active**  
- [ ] **Discuss** → test message  
- [ ] (Optional) Load [demo scenarios](../demo/ai_agent_demo_scenarios.xml) via module demo or shell `convert_file`
- [ ] Sales & Inventory demo: quest **Demo Chat — Sales & Inventory** + 3 **AI Memory** records **Active** (see §12)

---

## 12. Sales & Inventory demo — test the knowledge base

This scenario loads **demo products, sale orders, and stock** into Odoo, embeds them into **AI Memory (FAISS)**, and answers questions in **Discuss** using **Demo Mock** (no OpenAI billing).

### What is in the knowledge base?

| AI Memory | Odoo source | Demo content |
|-------------|-------------|--------------|
| **DEMO Products Catalog** | `product.product` | 4 products (`DEMO-SRV-001`, `DEMO-PROD-010/020/030`) |
| **DEMO Sales Orders** | `sale.order` | `DEMO-ACME-2026`, `DEMO-BETA-2026` |
| **DEMO Stock On Hand** | `stock.quant` | Brackets **250**, chairs **45**, desks **18** |

**Agent:** *Sales & Inventory Demo Assistant* (3 memories linked)  
**Quest:** *Demo Chat — Sales & Inventory* (Discuss 1:1 chat)

> Use **Demo Chat — Sales & Inventory**, not *Demo Chat — Odoo Helper*. Only the Sales & Inventory agent has the product/order/stock memories.

### Step 1 — Load demo data (once per database)

**Option A — Install module with demo data**

Install `ai_agent` with **Load demonstration data** checked (requires **Sales** and **Inventory** apps).

**Option B — Existing database (recommended)**

```powershell
cd D:\odoo\odoo18
.\.venv\Scripts\python.exe .\odoo18\odoo-bin server -c .\odoo_conf\odoo18.conf

# In another terminal:
Get-Content D:\odoo\odoo18\scripts\setup_ai_agent_sales_inventory_demo.py | `
  .\.venv\Scripts\python.exe odoo18\odoo-bin shell -c odoo_conf\odoo18.conf -d odoo18 --no-http
```

This creates DEMO partners/products/orders, sets stock, builds FAISS indexes, and pins the Discuss chat for admin.

### Step 2 — Verify configuration

| Check | Where | Expected |
|-------|--------|----------|
| Chat LLM | **LLMs → Demo Mock-demo-gpt** | Status **Confirmed** |
| Embed LLM | **LLMs → Demo Mock-demo-embed** | Status **Confirmed** |
| Memories | **AI Memory** | 3× **DEMO *** records, status **Active**, FAISS built |
| Agent | **Agents → Sales & Inventory Demo Assistant** | **Memory** tab shows 3 lines |
| Quest | **Ai Quest → Demo Chat — Sales & Inventory** | **Active**, agent linked |

If a memory is **Draft**, open it and click **Run** (or re-run the setup script above).

### Step 3 — Test in Discuss (get a result)

1. Open **Discuss** (main menu).
2. In the sidebar, open **Demo Chat — Sales & Inventory** (not Odoo Helper).
3. Type a question and press **Enter**.
4. Wait a few seconds for the bot reply.

**Example questions and expected answers**

| Ask | You should see (from knowledge) |
|-----|----------------------------------|
| How many **DEMO Steel Bracket Kit** do we have on hand? | Qty available **250**, SKU **DEMO-PROD-010**, price **120** |
| What is the list price of **DEMO-PROD-020**? | **DEMO Ergonomic Chair**, price **349**, qty **45** |
| What is the total amount for **DEMO-ACME-2026**? | Customer **DEMO Acme Trading**, total about **24,150**, state **sale** |
| Who is the customer on **DEMO-BETA-2026**? | **DEMO Beta Retail** |
| How many **chairs** are in stock? | **DEMO Ergonomic Chair**, qty **45** |

Use product names, SKUs (`DEMO-PROD-*`), or order refs (`DEMO-ACME-2026`). Questions about **price**, **stock**, **customer**, and **order total** work best.

```
You: How many DEMO Steel Bracket Kit do we have on hand?
Bot: DEMO Steel Bracket Kit — Default Code DEMO-PROD-010 — Qty Available 250.0 ...
```

### Step 4 — Automated screenshots (Playwright)

UI proof for training/docs is captured automatically:

```powershell
cd D:\odoo\odoo18
$env:ODOO_URL="http://127.0.0.1:8018"
$env:ODOO_DB="odoo18"
npx playwright test ai_agent_sales_inventory_chat_uat.spec.ts `
  --config=projects/mg_projects/ai_agent-18.0.1.0/ai_agent/tests/playwright.config.ts
```

Output: [screenshots/sales-inventory-chat/](screenshots/sales-inventory-chat/README.md) (memory, agent, quest, Discuss Q&A with answers).

### Troubleshooting knowledge chat

| Problem | Fix |
|---------|-----|
| *I could not find that in the loaded knowledge base* | Use quest **Demo Chat — Sales & Inventory**; re-run setup script; confirm 3 memories **Active** |
| Wrong or generic answer | Restart Odoo after code updates; rebuild memory (**Run** on each DEMO memory) |
| No **Sales & Inventory** in Discuss sidebar | Run setup script (`setup_demo_discuss_channels`) or save quest **Active** again |
| Empty stock answers | Products must be **storable**; run `setup_demo_sales_inventory_stock` via setup script |
| Works in shell but not UI | Same quest in Discuss; hard-refresh browser (Ctrl+F5) |

More demo details: [demo/README.md](../demo/README.md).

---

## Screenshots (automated UAT)

Playwright captures step-by-step UI images into [screenshots/user-guide/](screenshots/user-guide/README.md):

```powershell
cd D:\odoo\odoo18
$env:ODOO_URL="http://127.0.0.1:8018"
$env:ODOO_DB="odoo18"
npx playwright test projects/mg_projects/ai_agent-18.0.1.0/ai_agent/tests/ai_agent_user_guide_uat.spec.ts
```

## Related docs

- [demo/README.md](../demo/README.md) — demo records list  
- [screenshots/sales-inventory-chat/README.md](screenshots/sales-inventory-chat/README.md) — Playwright shots for §12  
- [../../edafa_legacy_project/docs/USER_GUIDE.md](../../../edafa_legacy_project/docs/USER_GUIDE.md) — Legacy Payroll scenarios  
- Module manifest description — provider list and pip packages  

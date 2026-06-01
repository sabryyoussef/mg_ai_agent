/**
 * Playwright UAT — screenshots for ai_agent/docs/USER_GUIDE.md
 *
 * Run:
 *   cd D:\odoo\odoo18
 *   $env:ODOO_URL="http://127.0.0.1:8018"
 *   $env:ODOO_DB="odoo18"
 *   npx playwright test ai_agent_user_guide_uat.spec.ts \
 *     --config=projects/mg_projects/ai_agent-18.0.1.0/ai_agent/tests/playwright.config.ts
 */
import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const ODOO_URL = process.env.ODOO_URL || "http://127.0.0.1:8018";
const ODOO_DB = process.env.ODOO_DB || "odoo18";
const ODOO_USER = process.env.ODOO_USER || "admin";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "admin";

const SHOT_ROOT = path.resolve(
  __dirname,
  "../docs/screenshots/user-guide"
);

/** Odoo keeps bus/longpoll open — never use networkidle. */
const GOTO_OPTS = { waitUntil: "domcontentloaded" as const };

async function waitForOdoo(page: import("@playwright/test").Page) {
  await page.waitForSelector(".o_web_client", { timeout: 60000 });
  await page.waitForTimeout(800);
}

async function shot(page: import("@playwright/test").Page, name: string) {
  const file = path.join(SHOT_ROOT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function odooLogin(page: import("@playwright/test").Page) {
  const auth = await page.request.post(
    `${ODOO_URL}/web/session/authenticate`,
    {
      headers: { "Content-Type": "application/json" },
      data: {
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: ODOO_DB,
          login: ODOO_USER,
          password: ODOO_PASSWORD,
        },
        id: 1,
      },
    }
  );
  const body = await auth.json();
  const uid = body?.result?.uid;
  expect(uid, `Odoo login failed: ${JSON.stringify(body)}`).toBeTruthy();

  const cookies = await page.request.storageState();
  await page.context().addCookies(cookies.cookies);

  await page.goto(`${ODOO_URL}/odoo`, GOTO_OPTS);
  await waitForOdoo(page);
}

const ACTION_VIEW =
  ".o_action_manager, .o_list_view, .o_kanban_view, .o_kanban_renderer, article";

async function openAction(page: import("@playwright/test").Page, xmlId: string) {
  await page.goto(`${ODOO_URL}/odoo/action-${xmlId}`, GOTO_OPTS);
  await page.waitForSelector(ACTION_VIEW, { timeout: 45000 });
  await page.waitForTimeout(600);
}

async function openRecordByText(
  page: import("@playwright/test").Page,
  text: string | RegExp
) {
  const listRow = page.locator("tr.o_data_row").filter({ hasText: text }).first();
  const kanbanCard = page
    .locator(".o_kanban_record, .o_kanban_renderer article, article")
    .filter({ hasText: text })
    .first();
  if (await listRow.isVisible({ timeout: 8000 }).catch(() => false)) {
    await listRow.click();
  } else {
    await expect(kanbanCard).toBeVisible({ timeout: 30000 });
    await kanbanCard.click();
  }
  await page.waitForSelector(".o_form_view", { timeout: 30000 });
}

async function openRecordIfVisible(
  page: import("@playwright/test").Page,
  text: string | RegExp
): Promise<boolean> {
  const listRow = page.locator("tr.o_data_row").filter({ hasText: text }).first();
  const kanbanCard = page
    .locator(".o_kanban_record, .o_kanban_renderer article, article")
    .filter({ hasText: text })
    .first();
  const target = (await listRow.isVisible({ timeout: 5000 }).catch(() => false))
    ? listRow
    : (await kanbanCard.isVisible({ timeout: 5000 }).catch(() => false))
      ? kanbanCard
      : null;
  if (!target) return false;
  await target.click();
  await page.waitForSelector(".o_form_view", { timeout: 30000 });
  return true;
}

test.describe("AI Agent USER_GUIDE screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SHOT_ROOT, { recursive: true });
  });

  test("capture user guide flow", async ({ page }) => {
    test.setTimeout(300_000);

    await odooLogin(page);
    await shot(page, "01_after_login");

    // --- Configuration: Providers (API keys) ---
    await openAction(page, "ai_agent.action_product_template");
    await shot(page, "02_providers_list");

    await openRecordByText(page, /Demo Mock/i);
    await page.waitForTimeout(800);
    await shot(page, "03_provider_demo_mock_form");

    // Scroll to LLM tab / API key if present
    const llmTab = page.getByRole("tab", { name: /LLM/i });
    if (await llmTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await llmTab.click();
      await page.waitForTimeout(500);
      await shot(page, "04_provider_llm_tab_api_key");
    }

    // --- LLMs (default kanban in Odoo 18) ---
    await openAction(page, "ai_agent.action_ai_agent_llm");
    await shot(page, "05_llms_list");

    if (
      await openRecordIfVisible(page, /Demo Mock|demo-gpt|demo_gpt/i)
    ) {
      await page.waitForTimeout(500);
      await shot(page, "06_llm_demo_mock_form");
    }

    // --- Agents ---
    await openAction(page, "ai_agent.action_ai_agent");
    await shot(page, "07_agents_list");

    if (await openRecordIfVisible(page, /Payroll Demo|Odoo Demo|Demo/i)) {
      await shot(page, "08_agent_form");
    }

    // --- Quests ---
    await openAction(page, "ai_agent.action_ai_quest");
    await shot(page, "09_quests_list");

    const questOpened = await openRecordIfVisible(
      page,
      /Demo Chat|demo.?chat/i
    );
    if (!questOpened) {
      await openRecordIfVisible(page, /Demo/i);
    }
    if (await page.locator(".o_form_view").isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.waitForTimeout(600);
      await shot(page, "10_quest_demo_chat_form");
    }

    // Context settings section
    const contextLabel = page.getByText("Context Settings", { exact: false });
    if (await contextLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contextLabel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await shot(page, "11_quest_context_settings");
    }

    // Agents tab on quest
    const agentsTab = page.getByRole("tab", { name: /^Agents$/i });
    if (await agentsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await agentsTab.click();
      await page.waitForTimeout(500);
      await shot(page, "12_quest_agents_tab");
    }

    // --- AI Orchestration home / kanban ---
    await openAction(page, "ai_agent.action_ai_quest");
    await page.waitForTimeout(800);
    await shot(page, "13_ai_orchestration_quests");

    // --- Discuss (chat with user scenario) ---
    await page.goto(`${ODOO_URL}/odoo/discuss`, GOTO_OPTS);
    await waitForOdoo(page);
    await page.waitForTimeout(2000);
    await shot(page, "14_discuss_inbox");

    // Demo 1:1 chat (bot user name = quest name, e.g. "Demo Chat — Odoo Helper")
    const chatEntry = page
      .locator(
        ".o-mail-DiscussSidebarChannel, .o-mail-DiscussSidebar-item, .o_DiscussSidebar_item"
      )
      .filter({ hasText: /Demo Chat|Odoo Helper|Demo Channel/i })
      .first();
    await expect(chatEntry).toBeVisible({ timeout: 20000 });
    await chatEntry.click();
    await page.waitForSelector(".o-mail-ChatWindow, .o-mail-Thread", {
      timeout: 20000,
    });
    await page.waitForTimeout(1200);
    await shot(page, "15_discuss_demo_chat_thread");

    // --- Settings shortcut (optional) ---
    await page.goto(`${ODOO_URL}/odoo/settings`, GOTO_OPTS);
    await waitForOdoo(page);
    await page.waitForTimeout(1500);
    const aiApp = page.locator(".o_settings_container").filter({
      hasText: /AI-Orchestration|AI Orchestration/i,
    });
    if (await aiApp.isVisible({ timeout: 10000 }).catch(() => false)) {
      await aiApp.scrollIntoViewIfNeeded();
      await shot(page, "16_settings_ai_orchestration");
    } else {
      await shot(page, "16_settings_general");
    }

    const files = fs.readdirSync(SHOT_ROOT).filter((f) => f.endsWith(".png"));
    expect(files.length).toBeGreaterThanOrEqual(10);
  });
});

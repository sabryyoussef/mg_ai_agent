/**
 * Playwright UAT — Sales & Inventory demo chat + knowledge screenshots
 *
 * Run:
 *   cd D:\odoo\odoo18
 *   $env:ODOO_URL="http://127.0.0.1:8018"
 *   $env:ODOO_DB="odoo18"
 *   npx playwright test ai_agent_sales_inventory_chat_uat.spec.ts \
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
  "../docs/screenshots/sales-inventory-chat"
);

const GOTO_OPTS = { waitUntil: "domcontentloaded" as const };

async function waitForOdoo(page: import("@playwright/test").Page) {
  await page.waitForSelector(".o_web_client", { timeout: 90000 });
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
        params: { db: ODOO_DB, login: ODOO_USER, password: ODOO_PASSWORD },
        id: 1,
      },
    }
  );
  const body = await auth.json();
  expect(body?.result?.uid, `Login failed: ${JSON.stringify(body)}`).toBeTruthy();
  const cookies = await page.request.storageState();
  await page.context().addCookies(cookies.cookies);
  await page.goto(`${ODOO_URL}/odoo`, GOTO_OPTS);
  await waitForOdoo(page);
}

async function openAction(page: import("@playwright/test").Page, xmlId: string) {
  await page.goto(`${ODOO_URL}/odoo/action-${xmlId}`, GOTO_OPTS);
  await page.waitForSelector(
    ".o_action_manager, .o_list_view, .o_kanban_view, .o_form_view",
    { timeout: 45000 }
  );
  await page.waitForTimeout(600);
}

test.describe("Sales & Inventory demo chat UAT", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SHOT_ROOT, { recursive: true });
  });

  test("screenshots: memory, agent, discuss chat Q&A", async ({ page }) => {
    test.setTimeout(300_000);

    await odooLogin(page);
    await shot(page, "01_after_login");

    // AI Memory — products
    await openAction(page, "ai_agent.action_ai_memory");
    await page.waitForSelector(".o_list_view, .o_kanban_view", { timeout: 30000 });
    await shot(page, "02_ai_memory_list");

    const memProducts = page
      .locator("tr.o_data_row, .o_kanban_record")
      .filter({ hasText: /DEMO Products Catalog/i })
      .first();
    if (await memProducts.isVisible({ timeout: 10000 }).catch(() => false)) {
      await memProducts.click();
      await page.waitForSelector(".o_form_view", { timeout: 30000 });
      await page.waitForTimeout(500);
      await shot(page, "03_ai_memory_products_form");
    }

    // Agent with memories (list or kanban)
    await openAction(page, "ai_agent.action_ai_agent");
    await shot(page, "04_agents_list");
    const agentRow = page
      .locator("tr.o_data_row, .o_kanban_record, article")
      .filter({ hasText: /Sales.*Inventory/i })
      .first();
    if (await agentRow.isVisible({ timeout: 15000 }).catch(() => false)) {
      await agentRow.click();
      await page.waitForSelector(".o_form_view", { timeout: 30000 });
      await shot(page, "05_agent_sales_inventory_form");
      const memTab = page.getByRole("tab", { name: /Memory/i });
      if (await memTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await memTab.click();
        await page.waitForTimeout(500);
        await shot(page, "06_agent_memory_tab");
      }
    }

    // Quest
    await openAction(page, "ai_agent.action_ai_quest");
    await shot(page, "07_quests_list");
    const questRow = page
      .locator("tr.o_data_row, .o_kanban_record, article")
      .filter({ hasText: /Sales.*Inventory/i })
      .first();
    if (await questRow.isVisible({ timeout: 15000 }).catch(() => false)) {
      await questRow.click();
      await page.waitForSelector(".o_form_view", { timeout: 30000 });
      await shot(page, "08_quest_sales_inventory_form");
    }

    // Discuss — Sales & Inventory chat
    await page.goto(`${ODOO_URL}/odoo/discuss`, GOTO_OPTS);
    await waitForOdoo(page);
    await page.waitForTimeout(1500);
    await shot(page, "09_discuss_inbox");

    const chatEntry = page
      .locator(".o-mail-DiscussSidebarChannel")
      .filter({ hasText: /Sales.*Inventory/i })
      .first();
    await expect(chatEntry).toBeVisible({ timeout: 25000 });
    await chatEntry.click();
    await page.waitForSelector(".o-mail-Composer-input, .o-mail-Thread", {
      timeout: 25000,
    });
    await page.waitForTimeout(1000);
    await shot(page, "10_discuss_sales_inventory_thread");

    const composer = page
      .locator(
        ".o-mail-Composer-input[contenteditable=true], .o-mail-Composer-input textarea, .o-mail-Composer textarea"
      )
      .first();
    await expect(composer).toBeVisible({ timeout: 15000 });

    const question =
      "How many DEMO Steel Bracket Kit do we have on hand?";
    await composer.click();
    await composer.fill(question);
    await shot(page, "11_chat_question_typed");

    await page.keyboard.press("Enter");
    await page.waitForTimeout(5000);

    const thread = page.locator(".o-mail-Thread, .o-mail-ChatWindow");
    await expect(thread.getByText(/250|DEMO-PROD-010|Qty Available/i).first()).toBeVisible({
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    await shot(page, "12_chat_bot_answer_stock");

    const question2 = "What is the total amount for DEMO-ACME-2026?";
    await composer.fill(question2);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(5000);
    await expect(
      thread.getByText(/24150|DEMO-ACME|Amount Total/i).first()
    ).toBeVisible({ timeout: 60000 });
    await shot(page, "13_chat_bot_answer_sales_order");

    expect(fs.readdirSync(SHOT_ROOT).filter((f) => f.endsWith(".png")).length).toBeGreaterThanOrEqual(8);
  });
});

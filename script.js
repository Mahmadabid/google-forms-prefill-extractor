const puppeteer = require("puppeteer-core");
const readline = require("node:readline");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");

const DEFAULT_FORM_URL = "https://docs.google.com/forms/d/your-form-id/prefill";
const [, , formUrlArg, waitSecondsArg] = process.argv;
const FORM_URL = formUrlArg ?? DEFAULT_FORM_URL;
const WAIT_SECONDS = Number.isFinite(Number(waitSecondsArg)) && Number(waitSecondsArg) > 0
  ? Number(waitSecondsArg)
  : 10;
const AUTOMATION_PROFILE = path.join(__dirname, ".chrome-automation");
const dir = path.join(__dirname, "output");
const OUTPUT_FILE = path.join(dir, "form-fields.json");

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function askForEnter(msg) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(msg, () => { rl.close(); resolve(); });
  });
}

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  return candidates.find(p => fs.existsSync(p));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: false,
    defaultViewport: null,
    userDataDir: AUTOMATION_PROFILE,
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--start-maximized", "--no-first-run", "--no-default-browser-check", "--disable-blink-features=AutomationControlled"],
  });

  const [page] = await browser.pages();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await page.goto(FORM_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  const hasData = await page.evaluate(() => typeof window.FB_PUBLIC_LOAD_DATA_ !== "undefined");
  if (!hasData) {
    await askForEnter("Sign in to Google if prompted, then press Enter when the form is visible... ");
    await page.goto(FORM_URL, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForFunction(() => typeof window.FB_PUBLIC_LOAD_DATA_ !== "undefined", { timeout: WAIT_SECONDS * 1000 });
  }

  const fields = await page.evaluate(() => {
    const typeMap = {
      0: "Short answer", 1: "Paragraph",       2: "Multiple choice",
      3: "Dropdown",     4: "Checkboxes",       5: "Linear scale",
      7: "Grid",         8: "Date",             9: "Time",
      10: "File upload",
    };

    const questions = window.FB_PUBLIC_LOAD_DATA_?.[1]?.[1];
    if (!Array.isArray(questions)) return [];

    return questions
      .filter(q => Array.isArray(q) && q[4]?.[0]?.[0] !== undefined)
      .map(q => {
        const entryBlock = q[4][0];
        const typeNum    = q[3];

        const field = {
          label:       q[1] ?? "",
          entry:       `entry.${entryBlock[0]}`,
          type:        typeMap[typeNum] ?? `Unknown (${typeNum})`,
          required:    entryBlock[2] === 1,   // 1 = required, 0 = optional
          description: q[2] ?? "",
        };

        // Options for multiple choice, dropdown, checkboxes, linear scale, grid
        const rawOptions = entryBlock[1];
        if (Array.isArray(rawOptions)) {
          field.options = rawOptions.map(o => o[0]);
        }

        // Linear scale min/max labels
        if (typeNum === 5 && Array.isArray(entryBlock[3])) {
          field.scaleMin = entryBlock[3][0] ?? null;
          field.scaleMax = entryBlock[3][1] ?? null;
        }

        return field;
      });
  });

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fields, null, 2), "utf-8");
  console.log(`✅ Saved ${fields.length} field(s) to: ${OUTPUT_FILE}`);
})().catch(err => {
  console.error("❌", err.message ?? err);
  process.exitCode = 1;
});
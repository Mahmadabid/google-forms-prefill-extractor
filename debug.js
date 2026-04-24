const puppeteer = require("puppeteer-core");
const path      = require("node:path");
const os        = require("node:os");
const fs        = require("node:fs");

const FORM_URL           = "https://docs.google.com/forms/d/1DMQdJoaXTooqeByHJh243LaXCIkanXKwC6lhqIXqsvw/prefill";
const AUTOMATION_PROFILE = path.join(__dirname, ".chrome-automation");

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
    args: ["--start-maximized", "--no-first-run", "--disable-blink-features=AutomationControlled"],
  });

  const [page] = await browser.pages();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await page.goto(FORM_URL, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => typeof window.FB_PUBLIC_LOAD_DATA_ !== "undefined", { timeout: 10000 });

  const raw = await page.evaluate(() => JSON.stringify(window.FB_PUBLIC_LOAD_DATA_));
  const data = JSON.parse(raw);

  // Print top-level keys and their types
  console.log("=== TOP LEVEL (indices 0-5) ===");
  for (let i = 0; i < Math.min(data.length, 6); i++) {
    const v = data[i];
    const preview = JSON.stringify(v)?.slice(0, 120);
    console.log(`[${i}] (${Array.isArray(v) ? "array len=" + v.length : typeof v}):`, preview);
  }

  console.log("\n=== data[1] (first 3 items) ===");
  if (Array.isArray(data[1])) {
    for (let i = 0; i < Math.min(data[1].length, 4); i++) {
      const v = data[1][i];
      console.log(`  [1][${i}] (${Array.isArray(v) ? "array len=" + v.length : typeof v}):`, JSON.stringify(v)?.slice(0, 200));
    }
  }

  // Full dump to file so you can inspect the whole thing
  fs.writeFileSync("fb_data_dump.json", JSON.stringify(data, null, 2));
  console.log("\n📄 Full dump saved to fb_data_dump.json");

  await browser.close();
})().catch(console.error);
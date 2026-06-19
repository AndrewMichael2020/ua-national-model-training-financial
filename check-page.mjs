import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (msg) => console.log("console:", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("pageerror:", err.message));
page.on("requestfailed", (req) =>
  console.log("requestfailed:", req.url(), req.failure()?.errorText),
);
try {
  await page.goto(
    "https://andrewmichael2020.github.io/ua-national-model-training-financial/",
    { waitUntil: "networkidle" },
  );
  console.log("title:", await page.title());
  console.log("bodyText:", (await page.textContent("body")).slice(0, 1000));
} catch (e) {
  console.error("goto failed", e);
}
await browser.close();

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import http from "http";
import handler from "serve-handler";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8080;
const SCREENSHOTS_DIR = join(__dirname, "screenshots");
const DIST_DIR = join(__dirname, ".");

if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const ROUTES = [
  "/404",
  "/Admin-Dashboard",
  "/APGI-Assessment",
  "/APGI-Experiments",
  "/APGI-Software-System",
  "/API",
  "/App-Appendix",
  "/App-Explorer",
  "/Assessment",
  "/Assessment-OnePage",
  "/Book-Available-Now",
  "/Book-Outline",
  "/components/navigation",
  "/funnels",
  "/funnels/1_individual_self_explorers",
  "/funnels/1_individual_self_explorers_journey",
  "/funnels/2_therapists_coaches",
  "/funnels/2_therapists_coaches_journey",
  "/funnels/3_academic_researchers",
  "/funnels/3_academic_researchers_journey",
  "/funnels/4_organizational_development",
  "/funnels/4_organizational_development_journey",
  "/funnels/5_educational_institutions",
  "/funnels/5_educational_institutions_journey",
  "/funnels/6_healthcare_professionals",
  "/funnels/6_healthcare_professionals_journey",
  "/funnels/7_tech_industry_professionals",
  "/funnels/7_tech_industry_professionals_journey",
  "/funnels/ad-display",
  "/funnels/social-media-ads",
  "/Home",
  "/Landing",
  "/Paper",
  "/pricing",
  "/Privacy-Policy",
  "/Profile",
  "/Quiz",
  "/sci/Academic-Dashboard",
  "/sci/Consciousness-Visualization",
  "/sci/Neuromodulatory-Cascade",
  "/sci/PsyStates",
  "/sci/PsyStates-Visualizer",
  "/sci/State-Network",
  "/Signature",
  "/State-Assessment",
  "/Terms-of-Service",
];

const DEVICES = [
  {
    name: "desktop-large",
    viewport: { width: 1920, height: 1080, isMobile: false },
  },
  {
    name: "desktop-standard",
    viewport: { width: 1366, height: 768, isMobile: false },
  },
  {
    name: "tablet",
    viewport: { width: 768, height: 1024, isMobile: true },
  },
  {
    name: "phone-large",
    viewport: { width: 414, height: 896, isMobile: true },
  },
  {
    name: "phone-small",
    viewport: { width: 375, height: 667, isMobile: true },
  },
];

function startServer() {
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: DIST_DIR,
      cleanUrls: false,
      trailingSlash: false,
      rewrites: [],
      directoryListing: false,
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function getChromeExecutablePath() {
  // Check for ARM64 Chrome first on Mac Silicon
  const arm64Chrome =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const x64Chrome =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  // On Mac Silicon, try to use the ARM64 version if available
  if (process.platform === "darwin" && process.arch === "arm64") {
    return arm64Chrome;
  }

  return x64Chrome;
}

async function capturePageScreenshot(page, device, route, theme = null) {
  const safeRoute = route === "/" ? "home" : route.replace(/^\/+|\/$/g, "");
  const themeSuffix = theme ? `-${theme}` : "";
  const fileName = `${device.name}-${safeRoute || "home"}${themeSuffix}.png`;
  const filePath = join(SCREENSHOTS_DIR, fileName);

  // Ensure the directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: filePath,
    fullPage: true,
    type: "png",
  });
  console.log(`✅ Screenshot saved: ${filePath}`);
}

async function hasThemeToggle(page) {
  try {
    // Check for common theme toggle selectors
    const themeSelectors = [
      '[data-testid="theme-toggle"]',
      ".theme-toggle",
      "[data-theme-toggle]",
      ".dark-mode-toggle",
      ".light-mode-toggle",
      'button[aria-label*="theme"]',
      'button[aria-label*="dark"]',
      'button[aria-label*="light"]',
      'input[type="checkbox"][id*="theme"]',
      ".theme-switch",
      ".theme-switcher",
      '[data-theme="light"]', // Check if data-theme attribute exists
      '[data-theme="dark"]',
    ];

    for (const selector of themeSelectors) {
      const element = await page.$(selector);
      if (element) {
        return { hasToggle: true, selector };
      }
    }

    // Check for theme-related CSS variables or classes
    const hasThemeVariables = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return (
        style.getPropertyValue("--color-bg-primary") ||
        style.getPropertyValue("--background-color") ||
        document.documentElement.hasAttribute("data-theme")
      );
    });

    return { hasToggle: hasThemeVariables, selector: null };
  } catch (error) {
    return { hasToggle: false, selector: null };
  }
}

async function setTheme(page, theme) {
  try {
    // Try to set theme via data-theme attribute
    await page.evaluate((targetTheme) => {
      document.documentElement.setAttribute("data-theme", targetTheme);
    }, theme);

    // Wait a bit for theme to apply
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if theme was applied
    const currentTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-theme");
    });

    if (currentTheme === theme) {
      return true;
    }

    // Try clicking theme toggle if data-theme didn't work
    const { hasToggle, selector } = await hasThemeToggle(page);
    if (hasToggle && selector) {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log(`⚠️  Could not set ${theme} theme:`, error.message);
    return false;
  }
}

async function takeScreenshots() {
  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: getChromeExecutablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-background-networking",
      "--disable-ipc-flooding-protection",
    ],
  });

  try {
    for (const device of DEVICES) {
      console.log(
        `\n📱 Starting screenshots for ${device.name} (${device.viewport.width}x${device.viewport.height})`,
      );

      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(10000);
      await page.setViewport(device.viewport);

      // Set user agent for better mobile emulation
      if (device.viewport.isMobile) {
        await page.setUserAgent(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        );
      }

      for (const route of ROUTES) {
        const url = `http://localhost:${PORT}${route}`;
        console.log(`\n🌐 Navigating to: ${url}`);

        try {
          await page.goto(url, {
            waitUntil: ["networkidle0", "domcontentloaded", "load"],
            timeout: 60000,
          });

          // Wait for content to be ready
          await new Promise((resolve) => setTimeout(resolve, 3000));

          try {
            // Wait for the app to load with better selectors
            await page.waitForSelector(
              '[data-testid="app"], #root, main, .app',
              {
                timeout: 10000,
              },
            );

            // Wait for dynamic content to load
            await page.waitForFunction(
              () => {
                return (
                  document.readyState === "complete" &&
                  document.querySelector('[data-testid="app"]') !== null
                );
              },
              { timeout: 10000 },
            );
          } catch (e) {
            console.log("⚠️  App selector not found, waiting for fallback...");
            // Fallback: wait for any content to be present
            await page.waitForFunction(
              () => {
                return document.body && document.body.children.length > 0;
              },
              { timeout: 5000 },
            );
          }

          // Check if page has theme support
          const { hasToggle } = await hasThemeToggle(page);

          if (hasToggle) {
            console.log(`🎨 Theme support detected for ${route}`);

            // Capture light theme first
            const lightSet = await setTheme(page, "light");
            if (lightSet) {
              console.log(`💡 Capturing light theme...`);
              await capturePageScreenshot(page, device, route, "light");
            } else {
              console.log(`💡 Capturing default theme as light...`);
              await capturePageScreenshot(page, device, route, "light");
            }

            // Capture dark theme
            const darkSet = await setTheme(page, "dark");
            if (darkSet) {
              console.log(`🌙 Capturing dark theme...`);
              await capturePageScreenshot(page, device, route, "dark");
            } else {
              console.log(`🌙 Dark theme not available, skipping...`);
            }
          } else {
            console.log(`📸 No theme support detected, capturing default...`);
            await capturePageScreenshot(page, device, route);
          }
        } catch (error) {
          console.error(`❌ Error capturing ${url}:`, error.message);

          // Try to capture a basic screenshot even if there's an error
          try {
            const safeRoute =
              route === "/" ? "home" : route.replace(/^\/+|\/$/g, "");
            const fileName = `${device.name}-${safeRoute || "home"}-error.png`;
            const filePath = join(SCREENSHOTS_DIR, fileName);

            // Ensure the directory exists
            const dir = dirname(filePath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }

            await page.screenshot({
              path: filePath,
              fullPage: true,
              type: "png",
            });
            console.log(`📸 Error screenshot saved: ${filePath}`);
          } catch (screenshotError) {
            console.error(
              `❌ Failed to capture error screenshot: ${screenshotError.message}`,
            );
          }
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
    console.log("👋 Browser closed");
  }
}

async function main() {
  console.log("🚀 Starting screenshot workflow");
  console.log("--------------------------------");

  try {
    console.log("🔨 Building the app...");
    execSync("npm run build:once", { stdio: "inherit" });

    console.log("\n🚀 Starting server...");
    const server = await startServer();

    try {
      console.log("\n📸 Starting screenshot capture...");
      await takeScreenshots();
      console.log("\n✅ All screenshots captured successfully!");
    } finally {
      server.close();
      console.log("👋 Server closed");
    }
  } catch (error) {
    console.error("❌ Error during screenshot workflow:", error);
    process.exit(1);
  }
}

main();

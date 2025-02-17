import { Builder, Capabilities } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";

(async () => {
  let capabilities = Capabilities.chrome();
  capabilities.set("pageLoadStrategy", "normal");
  let options = new Options();
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");

  options.excludeSwitches(["enable-automation"]);
  //options.("useAutomationExtension", false);
  //options.addExtensions("useAutomationExtension", false);

  options.addArguments("disable-infobars");
  options.addArguments("disable-blink-features=AutomationControlled");

  options.setPageLoadStrategy("normal");

  let driver = await new Builder()
    .forBrowser("chrome")
    .withCapabilities(capabilities)
    .setChromeOptions(options)
    .build();

  await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
  await driver.sendDevToolsCommand("Network.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.76 Mobile Safari/537.36",
  });
  await options.addArguments("--disable-popup-blocking");

  await driver.manage().window().setRect({ width: 390, height: 844 });
  await driver.switchTo().newWindow("tab");
  await driver.get("https://www.bet365.com/#/AC/B18/C20604387/D48/E1453/F10/");
  cookies = driver.findElements(By.css(".ccm-CookieConsentPopup_Accept"));
  if (cookies.length > 0) cookies[0].click();
  await driver.switchTo().newWindow("tab");
  await driver.get("https://www.bet365.com/#/AC/B18/C20604387/D48/E1453/F10/");
})();

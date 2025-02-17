import time
from selenium_driverless import webdriver
from selenium_driverless.webdriver import ChromeOptions
from selenium_driverless.types.by import By
from selenium_driverless.scripts.switch_to import SwitchTo

async def open_tab(driver,link):
    #await driver.execute_script(f"""window.open('{link}', "_blank");""")
    target = await driver.new_window('tab', url=link, activate=True)
    await driver.sleep(2)
    await driver.switch_to.target(target_id=target)
    print(await driver.current_url)

#Accept Cookies
async def accept_cookies(driver):
    cookies = await driver.find_elements(By.CSS_SELECTOR, ".ccm-CookieConsentPopup_Accept ")
    if(len(cookies) > 0):
        await cookies[0].click()

async def driver_code():

    options = ChromeOptions()

    useragentarray = [
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.76 Mobile Safari/537.36"
    ]

    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # options.add_argument(f"--user-data-dir=./profile{driver_num}")

    #options.add_experimental_option("excludeSwitches", ["enable-automation"])
    #options.add_experimental_option("useAutomationExtension", False)
    #options.add_argument("disable-infobars")
    #options.add_argument("disable-blink-features=AutomationControlled")

    driver = await webdriver.Chrome(
        # 'C:\\Users\\Gustavo\\Downloads\\chromedriver-win64\\chromedriver.exe',
        options=options,
    )
    await driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )

    await driver.execute_cdp_cmd(
        "Network.setUserAgentOverride", {"userAgent": useragentarray[0]}
    )

    options.add_argument("--disable-popup-blocking")
    #     driver.execute_script(
    #         """setTimeout(() => window.location.href="https://www.bet365.com.au", 100)"""
    #     )

    await driver.set_window_size(390, 844)
    return driver

player_props = ["Pontos", "Assistências", "Rebotes", "Roubos", "Inversão de Posse de Bola", "Tocos", "Cestas de 3 Convertidas",
                 "Pontos e Assistências", "Pontos e Rebotes", "Assistências e Rebotes", "Pontos, Assistências e Rebotes", "Roubos e Tocos"]
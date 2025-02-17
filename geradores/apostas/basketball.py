import utils
import time
from selenium_driverless.types.by import By

async def get_basketball_odds(driver):
    await utils.open_tab(driver, 'https://www.bet365.bet.br/#/AC/B18/C20604387/D48/E1453/F10/')
    await driver.sleep(2)
    await utils.accept_cookies(driver)
    games = []
    games_ = await driver.find_elements(By.CSS_SELECTOR,".scb-ParticipantFixtureDetailsHigherBasketball_LhsContainer")
    games_ = games_[4:5]

    for i in range(len(games_)):
        jogo = {}
        teams = []

        """ if(i > 0):
            #await utils.open_tab(driver, 'https://www.bet365.bet.br/#/AC/B18/C20604387/D48/E1453/F10/')
            await driver.find_element(By.CSS_SELECTOR, ".scb-ParticipantFixtureDetailsHigherBasketball_BookCloses", timeout=3)
            await driver.sleep(3)
            games_ = await driver.find_elements(By.CSS_SELECTOR,".scb-ParticipantFixtureDetailsHigherBasketball_LhsContainer") """

        await games_[i].find_element(By.CSS_SELECTOR, ".scb-ParticipantFixtureDetailsHigherBasketball_BookCloses")
        link = await games_[i].find_element(By.CSS_SELECTOR,".scb-ParticipantFixtureDetailsHigherBasketball_TeamAndScoresContainer")
        await link.click();
        await driver.sleep(2);
        #await utils.open_tab(driver, await driver.current_url)
        #await driver.sleep(2);

        teams_ = await driver.find_elements(
                        By.CSS_SELECTOR, ".sph-FixturePodHeader_TeamName "
                        )
        for i in teams_:
            teams.append(await i.text)
        
        jogo["timeCasa"] = teams[1]
        jogo["timeFora"] = teams[0]
        jogo["odds"] = {};
        jogo["odds"]["main"] = await get_main_markets(driver, teams)
        #await utils.open_tab(driver, await driver.current_url + "I43")
        jogo["odds"]["playerProps"] = await get_player_props(driver)

        games.append(jogo);

    return games

async def get_main_markets(driver, teams):
    labels = []
    odds = []

    labels_ = await driver.find_elements(By.CSS_SELECTOR,".sab-ParticipantCenteredStackedOTB_Handicap")
    for i in labels_:
        labels.append(await i.text) 
    
    odds_ = await driver.find_elements(By.CSS_SELECTOR,".sab-ParticipantCenteredStackedOTB_Odds")
    for i in odds_:
        odds.append(await i.text) 
    
    return [
        {"type": "Total", "prop": labels[1], "odd": odds[1]},
        {"type": "Total", "prop": labels[3], "odd": odds[4]},
        {"type": "Handicap", "team": teams[0], "prop": labels[0], "odd": odds[0]},
        {"type": "Para Ganhar", "team": teams[0], "odd": odds[2]},
        {"type": "Handicap", "team": teams[1], "prop": labels[2], "odd": odds[3]},
        {"type": "Para Ganhar", "team": teams[1], "odd": odds[5]},
    ]

async def get_player_props(driver):
    odds = {};
    group_ = await driver.find_element(By.XPATH, "//div[@data-content='Jogador - Apostas Especiais']")
    await group_.click()
    #await driver.sleep(3)
    #await utils.open_tab(driver, await driver.current_url)
    await driver.sleep(2)
    for prop in utils.player_props:
        print(prop)
        odds[prop.replace("ê", "e").replace("ã", "a")] = []
        prop_group = await driver.find_element(By.XPATH, "//div[text()='" + prop + " (Mais de/Menos de)']/ancestor::div[3]")
        
        try:
            odds_group = await prop_group.find_element(By.XPATH,"./following-sibling::div")
        except:
            await (await driver.find_element(By.XPATH, "//div[text()='" + prop + " (Mais de/Menos de)']")).click();
            await driver.sleep(.5)
            prop_group = await driver.find_element(By.XPATH, "//div[text()='" + prop + " (Mais de/Menos de)']/ancestor::div[3]")
            odds_group = await prop_group.find_element(By.XPATH,"./following-sibling::div")

        try:
            show_more_link = await odds_group.find_element(By.CSS_SELECTOR,".msl-ShowMore")
            await show_more_link.click()
            await driver.sleep(.5)   
            prop_group = await driver.find_element(By.XPATH, "//div[text()='" + prop + " (Mais de/Menos de)']/ancestor::div[3]")
            odds_group = await prop_group.find_element(By.XPATH, "./following-sibling::div")
        except:
            pass

        player_names_ = await odds_group.find_elements(By.CSS_SELECTOR, ".srb-ParticipantLabelWithTeam_Name")
        for i in player_names_:
            print(await i.text)
        team_names_ = await odds_group.find_elements(By.CSS_SELECTOR, ".srb-ParticipantLabelWithTeam_Team")

        print(odds_group)
        over_odds_ = await odds_group.find_element(By.XPATH, "./div/div[2]")
        print(over_odds_)
        over_odds_prop_ = await over_odds_.find_elements(By.CSS_SELECTOR, ".gl-ParticipantCenteredStacked_Handicap")
        over_odds_odd_ = await over_odds_.find_elements(By.CSS_SELECTOR, ".gl-ParticipantCenteredStacked_Odds")

        print(over_odds_prop_)

        under_odds_ = await odds_group.find_element(By.XPATH, "./div/div[3]")
        under_odds_odd_ = await under_odds_.find_elements(By.CSS_SELECTOR, ".gl-ParticipantCenteredStacked_Odds")

        for i in range(len(player_names_)):
            odds[prop.replace("ê", "e").replace("ã", "a")].append({
                "type": prop.replace("ê", "e").replace("ã", "a"),
                "player": await player_names_[i].text,
                #"team": team_names_[i].text,
                "prop": await over_odds_prop_[i].text,
                "overOdd": await over_odds_odd_[i].text,
                "underOdd": await under_odds_odd_[i].text
            })
        
    return odds
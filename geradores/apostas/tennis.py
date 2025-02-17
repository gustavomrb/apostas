import utils
import time
from selenium.webdriver.common.by import By

ABU = ["E21030549", "F"]
CLUJ = ["E21030583", "F"]

DALLAS = ["E21030634", "M"]
MUMBAI = ["E21030523", "F"]
ROSARIO = ["E21030848", "M"]
BRISBANE = ["E21030908","M"]
CHENNAI = ["E21030786", "M"]


torneio = ABU

async def get_tennis_odds(driver):
    await utils.open_tab(driver, 'https://www.bet365.bet.br/#/AC/B13/C1/D1002/' + torneio[0] + "/F1/G83/")
    
    time.sleep(2)
    games = []
    idJogo = 1

    idsLive = []
    datas = []
    horarios = []
    playersCasa = []
    playersFora = []
    oddsCasa = []
    oddsFora = []

    groups_ = await driver.find_elements(By.CSS_SELECTOR, ".gl-MarketGroupContainer")

    for i, group_ in enumerate(groups_):

        games_ = await group_.find_elements(By.CSS_SELECTOR, ".rcl-ParticipantFixtureDetails_LhsContainer")

        for j, game_ in enumerate(games_):
            try:
                await game_.find_element(By.CSS_SELECTOR, ".pi-CouponParticipantClockInPlay_Extra")
                idsLive.append(j)
                continue
            except:
                try:
                    horario = await (await game_.find_element(By.CSS_SELECTOR,".rcl-ParticipantFixtureDetails_BookCloses")).text
                except:
                    horario = "00:00"
                horarios.append(horario)
                datas.append((await (await game_.find_element(By.XPATH, "//parent::*/preceding-sibling::div[contains(@class, 'rcl-MarketHeaderLabel')][1]")).text).split(' - ')[0])

        players_ = await group_.find_elements(By.CSS_SELECTOR, ".rcl-ParticipantFixtureDetailsTeam_TeamName")
        playersCasa_ = []
        playersFora_ = []

        for playerCasa_ in players_[0::2]:
            playersCasa_.append(playerCasa_)
        for playerFora_ in players_[1::2]:
            playersFora_.append(playerFora_)
        
        for j, playerCasa_ in enumerate(playersCasa_):
            if j not in idsLive:
                playersCasa.append(await playerCasa_.text)
        for j, playerFora_ in enumerate(playersFora_):
            if j not in idsLive:
                playersFora.append(await playerFora_.text)
        
        odds_ = await group_.find_elements(By.CSS_SELECTOR, ".sgl-ParticipantOddsOnly80_Odds")

        oddsCasa_ = []
        oddsFora_ = []

        for j in range(len(playersCasa_)):
            oddsCasa_.append(await odds_[j])
            oddsFora_.append(await odds_[len(playersCasa_) + j])

        for j, oddCasa_ in enumerate(oddsCasa_):
            if j not in idsLive:
                oddsCasa.append(await oddCasa_.text)
        for j, oddFora_ in enumerate(oddsFora_):
            if j not in idsLive:
                oddsFora.append(await oddFora_.text)
        
        for j in range(len(playersCasa)):
            games.append({ "id": str(idJogo), "data": datas[j], "horario": horarios[j], 
                          "playerHome": {"name": playersCasa[j], "gender": torneio[1], "odds": oddsCasa[j]},
                          "playerAway": {"name": playersFora[j], "gender": torneio[1], "odds": oddsFora[j]}})
            idJogo += 1
    return games
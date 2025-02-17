
import time
import basketball
import utils
import json
import tennis
import asyncio

esporte = "T"

async def main():
    #cria driver
    new_driver = await utils.driver_code()

    #abre bet3655 em nova aba
    await utils.open_tab(new_driver, 'https://www.bet365.bet.br/#/HO/')
    await utils.accept_cookies(new_driver)

    if esporte == "B":
        #pega odds de basquete
        games = await basketball.get_basketball_odds(new_driver)
        with open("games.json", 'w') as f:
            json.dump(games, f)
    elif esporte == "T":
        games = await tennis.get_tennis_odds(new_driver)
        with open("geradores/tenis/jogosTenis.json", 'w') as f:
            json.dump(games, f)
    
    await new_driver.quit()

asyncio.run(main())
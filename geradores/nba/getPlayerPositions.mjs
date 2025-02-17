import puppeteer from "puppeteer";
import fs from "fs";

const playersJson = JSON.parse(fs.readFileSync("./geradores/nba/jogadoresComId.json"));
const alfabeto = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  for (let letra of alfabeto) {
    await page.goto("https://www.covers.com/sport/basketball/nba/players/" + letra);
    await page.waitForSelector(".covers-CoversAlphabeticalPlayer-Table");

    let allPlayersElem = await page.$$(".covers-CoversAlphabeticalPlayer-Table tbody tr");

    if (allPlayersElem) {
      for (let playerElem of allPlayersElem) {
        const playerFullName = await playerElem.$eval("td:first-child a", (n) => {
          const playerNameSplit = n.innerText.split(", ");
          return playerNameSplit[1] + " " + playerNameSplit[0];
        });

        const playerPosition = await playerElem.$eval("td:nth-child(2)", (n) => n.innerText);

        const playerJson = playersJson.find((p) => p.nomeCompleto === playerFullName);
        if (playerJson) {
          playerJson.posicao = playerPosition;
        }
      }
    }
  }

  fs.writeFile("./geradores/nba/jogadoresComId.json", JSON.stringify(playersJson, null, " "), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

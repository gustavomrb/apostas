import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await (await browser.createIncognitoBrowserContext()).newPage();

  await page.goto("https://www.nba.com/players");
  await page.waitForSelector(".players-list");
  await page.waitForTimeout(5000);

  let jogadores = [];

  let ultimaPagina = await page.$eval("select[title='Page Number Selection Drown Down List'] option:last-child", (n) =>
    parseInt(n.innerText)
  );
  let botaoProximaPagina = await page.$("button[title='Next Page Button']");

  for (let i = 0; i < ultimaPagina; i++) {
    let rowsJogadores = await page.$$(".players-list tbody tr");
    for (let row of rowsJogadores) {
      let firstNames = await row.$$eval("td a div:nth-child(2) p:first-child", (nodes) =>
        nodes.map((n) => n.innerText)
      );

      let lastNames = await row.$$eval("td a div:nth-child(2) p:nth-child(2)", (nodes) =>
        nodes.map((n) => n.innerText)
      );

      let idJogadores = await row.$$eval("td:first-child a", (nodes) => nodes.map((n) => n.href.split("/")[4]));

      let timeJogadores = await row.$$eval("td:nth-child(2) a", (nodes) => nodes.map((n) => n.innerText));
      let nomesCompletos = firstNames.map((n, i) => n + " " + lastNames[i]);
      let nomesAction = firstNames.map((n, i) => n.substring(0, 1) + "." + lastNames[i].split(" ")[0]);

      jogadores = jogadores.concat(
        idJogadores.map((n, i) => ({
          id: n,
          nome: nomesAction[i],
          nomeCompleto: nomesCompletos[i],
          time: timeJogadores[i],
        }))
      );
    }
    await botaoProximaPagina.click();
  }

  fs.writeFile("jogadoresComId.json", JSON.stringify(jogadores, null, " "), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

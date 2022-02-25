var puppeteer = require("puppeteer");
var fs = require("fs");

let jogadoresJson = [];
try {
  jogadoresJson = fs.readFileSync("./geradores/tenis/jogadores.json");
  jogadoresJson = JSON.parse(jogadoresJson);
} catch (e) {
  if (e.code !== "ENOENT") {
    throw e;
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  for (let ano of ["2021"]) {
    await page.goto(`https://www.tennisexplorer.com/ranking/atp-men/${ano}`);
    await page.waitForSelector(".flags");

    const datas = await page.$$eval("select[name='date'] > option", (nodes) =>
      nodes.map((n) => n.innerText.split(". ").reverse().join("-"))
    );

    for (let data of datas) {
      for (var numPage = 1; numPage <= 8; numPage++) {
        await page.goto(`https://www.tennisexplorer.com/ranking/atp-men/${ano}/?date=${data}&page=${numPage}`);
        await page.waitForSelector(".flags");
        const rankJogadores = await page.$$eval(".flags tr .rank", (nodes) =>
          nodes.map((n) => n.innerText.replace(".", ""))
        );
        const linksJogadores = await page.$$eval(".flags tr .t-name a", (nodes) =>
          nodes.map((n) => n.href.split("/").at(-2))
        );
        const nomesJogadores = await page.$$eval(".flags tr .t-name a", (nodes) =>
          nodes.map((n) => {
            const nomeSplit = n.innerText.split(" ");
            return [nomeSplit.at(-1)].concat(nomeSplit.splice(0, nomeSplit.length - 1)).join(" ");
          })
        );

        for (var i = 0; i < rankJogadores.length; i++) {
          let jogador = jogadoresJson.find((j) => j.link === linksJogadores[i]);
          if (!jogador) {
            jogador = { nome: nomesJogadores[i], link: linksJogadores[i], ranks: [] };
            jogadoresJson.push(jogador);
          }
          if (jogador.ranks.length === 0 || rankJogadores[i] !== jogador.ranks.at(-1).rank) {
            jogador.ranks.push({ data: data, rank: rankJogadores[i] });
          } else {
            jogador.ranks.at(-1).data = data;
          }
        }
      }
    }
  }

  let jogadoresFinal = JSON.stringify(jogadoresJson, null, "  ");
  fs.writeFileSync("./geradores/tenis/jogadores.json", jogadoresFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

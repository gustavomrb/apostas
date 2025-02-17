var puppeteer = require("puppeteer");
var fs = require("fs");

let jogos = [];
try {
  jogos = JSON.parse(fs.readFileSync("./geradores/tenis/jogosTenis.json"));
} catch (e) {
  if (e.code !== "ENOENT") {
    throw e;
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const resultados = await adicionaResultadosJogadores(jogos, page);

  let jsonJogosFinal = JSON.stringify(jogos, null, "  ");
  fs.writeFileSync("./geradores/tenis/jogosTenis.json", jsonJogosFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  let jsonResultadosFinal = JSON.stringify(resultados, null, "  ");
  fs.writeFileSync("./geradores/tenis/resultados.json", jsonResultadosFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

async function adicionaResultadosJogadores(jogos, page) {
  const resultados = [];
  //jogos = jogos.slice(0, 3);

  for (let jogo of jogos) {
    let resultsHome = await adicionaResultadosJogador(jogo.playerHome, page);
    let resultsAway = await adicionaResultadosJogador(jogo.playerAway, page);

    resultados.push({
      player: jogo.playerHome.name,
      ranking: jogo.playerHome.ranking,
      resultados: resultsHome,
    });

    resultados.push({
      player: jogo.playerAway.name,
      ranking: jogo.playerAway.ranking,
      resultados: resultsAway,
    });
  }
  return resultados;
}

async function adicionaResultadosJogador(player, page) {
  const jogos = [];
  console.log(player.name);
  await new Promise((r) => setTimeout(r, 3000));
  await page.goto(
    "https://www.tennisabstract.com/cgi-bin/" +
      (player.gender == "F" ? "w" : "") +
      "player-classic.cgi?p=" +
      player.name.replaceAll(" ", "").replaceAll("-", "") +
      "&f=ACareerqq"
  );
  await page.waitForSelector(`#stats`);
  console.log("entrou");

  let ranking_ = null;

  ranking_ = await page.$x("//*[text()='Current rank: ']//b");
  if (ranking_.length === 0) {
    return;
  }

  const age_ = await page.$x("//*[starts-with(text(), 'Age: ')]");

  player.ranking = await ranking_[0].evaluate((n) => n.innerText);
  player.age = await age_[0].evaluate((n) => n.innerText.split(" ")[1]);
  let jogos_ = await page.$$("#matches tbody tr");

  for (let jogo_ of jogos_) {
    try {
      if ((await jogo_.$eval("td:nth-child(8)", (n) => n.innerText)) === "Live Scores") continue;
    } catch (e) {}

    const data = await jogo_.$eval("td:nth-child(1)", (n) => n.innerText);
    const campeonato = await jogo_.$eval("td:nth-child(2)", (n) => n.innerText);
    const quadra = await jogo_.$eval("td:nth-child(3)", (n) => n.innerText);
    const round = await jogo_.$eval("td:nth-child(4)", (n) => n.innerText);
    const placar = await jogo_.$eval("td:nth-child(8)", (n) => n.innerText);
    const oponente = await jogo_.$eval("td:nth-child(7) a", (n) => n.innerText);
    const oponenteRanking = await jogo_.$eval("td:nth-child(6)", (n) => n.innerText);
    const resultado = await jogo_.$eval("td:nth-child(7) span:nth-child(3)", (n) => {
      return n.innerText.includes("[") ? "L" : "W";
    });

    jogos.push({
      campeonato,
      data,
      quadra,
      round,
      placar,
      oponente,
      oponenteRanking,
      resultado,
    });
  }
  return jogos;
}

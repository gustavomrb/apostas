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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`https://www.tennisexplorer.com/matches/?timezone=-3`);
  await page.waitForSelector(".tbl.lGray table.result");

  const jogos = [];
  let id = 0;
  const divJogos = (await page.$$(".tbl.lGray table.result")).at(-1);

  let divsTorneio = await divJogos.$$(".head.flags");

  for (let divTorneioAtual of divsTorneio) {
    const divNomeCampeonato = await divTorneioAtual.$("a");
    const nomeCampeonato = divNomeCampeonato ? await divTorneioAtual.$eval("a", (n) => n.innerText.trim()) : null;
    const nomesCampeonato = ["Marseille"];
    if (nomeCampeonato && nomesCampeonato.includes(nomeCampeonato)) {
      let jogadorHome = await divTorneioAtual.getProperty("nextElementSibling");
      let jogadorAway = await jogadorHome.getProperty("nextElementSibling");
      while (true) {
        let jogadorHomeLink = await jogadorHome.$eval(".t-name a", (n) => n.href.split("/").at(-2));
        let jogadorAwayLink = await jogadorAway.$eval(".t-name a", (n) => n.href.split("/").at(-2));
        const horario = await jogadorHome.$eval(".first.time", (n) => n.innerText.trim());
        const nbr = await jogadorHome.$(".nbr");

        if (nbr) {
          let jogadorCasa = buscaJogadorJson(jogadorHomeLink);
          if (!jogadorCasa)
            jogadorCasa = { nome: await jogadorHome.$eval(".t-name a", (n) => n.innerText), link: jogadorHomeLink };

          let jogadorFora = buscaJogadorJson(jogadorAwayLink);
          if (!jogadorFora)
            jogadorFora = { nome: await jogadorAway.$eval(".t-name a", (n) => n.innerText), link: jogadorAwayLink };

          jogadorCasa.ranking = buscaRankingAtual(jogadorHomeLink);
          jogadorFora.ranking = buscaRankingAtual(jogadorAwayLink);

          const jogo = {
            id: "" + id++,
            horario: horario,
            jogadorCasa: jogadorCasa,
            jogadorFora: jogadorFora,
          };

          jogos.push(jogo);
        }

        const nextSibling = await jogadorAway.getProperty("nextElementSibling");
        nextSiblingClass = nextSibling
          ? await nextSibling.evaluate((n) => {
              return n ? n.className.split(" ")[0] : null;
            })
          : null;

        if (!nextSiblingClass || nextSiblingClass.includes("head")) break;

        jogadorHome = nextSibling;
        jogadorAway = await jogadorHome.getProperty("nextElementSibling");
      }
    }
  }

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

function buscaJogadorJson(linkJogador) {
  const jogador = jogadoresJson.find((t) => t.link === linkJogador);

  return jogador ? { nome: jogador.nome, link: jogador.link } : null;
}

async function adicionaResultadosJogadores(jogos, page) {
  const resultados = [];
  for (let jogo of jogos) {
    resultados.push({
      link: jogo.jogadorCasa.link,
      resultados: await adicionaResultadosJogador(jogo.jogadorCasa.link, page),
    });

    resultados.push({
      link: jogo.jogadorFora.link,
      resultados: await adicionaResultadosJogador(jogo.jogadorFora.link, page),
    });
  }
  return resultados;
}

async function adicionaResultadosJogador(jogadorLink, page) {
  const jogos = [];
  const anos = ["2022", "2021"];

  for (let ano of anos) {
    await page.goto(`https://www.tennisexplorer.com/player/${jogadorLink}/?annual=${ano}`);
    await page.waitForSelector(`#center`);

    if (!(await page.$(`#matches-${ano}-1-data .head.flags`))) continue;

    let divsTorneio = await page.$$(`#matches-${ano}-1-data .head.flags`);

    for (let divTorneioAtual of divsTorneio) {
      const campeonatoElem = await divTorneioAtual.$("a");
      const nomeCampeonato = campeonatoElem ? await campeonatoElem.evaluate((n) => n.innerText.trim()) : "Future";

      let jogo = await divTorneioAtual.getProperty("nextElementSibling");
      while (true) {
        let oponenteLink = await jogo.$eval(".t-name a:not(.notU)", (n) => n.href.split("/").at(-2));
        let data = await jogo.$eval(".first.time", (n) => n.innerText.replaceAll(".", "-"));
        data = data + ano;
        const quadraElem = await jogo.$(".s-color span");
        const quadra = quadraElem ? await (await quadraElem.getProperty("title")).jsonValue() : "";
        const round = await jogo.$eval(".round", (n) => n.innerText);
        const placar = await jogo.$eval(".tl a", (n) => n.innerText);
        const oponente = jogadoresJson.find((j) => j.link === oponenteLink);
        const oponenteRanking = buscaRanking(oponente, data);
        const resultado = oponenteLink === (await jogo.$eval(".t-name a", (n) => n.href.split("/").at(-2))) ? "L" : "W";

        jogos.push({
          campeonato: nomeCampeonato,
          data: data,
          quadra: quadra,
          round: round,
          placar: placar,
          oponente: oponente ? oponente.nome : "N/A",
          oponenteRanking: oponenteRanking,
          resultado: resultado,
        });

        const nextSibling = await jogo.getProperty("nextElementSibling");
        nextSiblingClass = nextSibling
          ? await nextSibling.evaluate((n) => {
              return n ? n.className.split(" ")[0] : null;
            })
          : null;

        if (!nextSiblingClass || nextSiblingClass.includes("head")) break;

        jogo = nextSibling;
      }
    }
  }

  return jogos;
}

function buscaRanking(jogador, data) {
  if (!jogador) return "401";
  data = new Date(data.split("-").reverse().join("-"));
  let datasArr = [];
  let dataRankArr = [];
  for (let rankObj of jogador.ranks) {
    const dataRankSplit = rankObj.data.split("-");
    const dataRankDate = new Date(`${dataRankSplit[1]}-${dataRankSplit[2]}-${dataRankSplit[0]}`);
    datasArr.push(dataRankDate);
    dataRankArr.push(rankObj.rank);
  }

  for (let [i, dataArr] of datasArr.entries()) {
    if (data >= dataArr) return jogador.ranks[i].rank;
  }

  return "N/A";
}

function buscaRankingAtual(jogadorLink) {
  let jogador = jogadoresJson.find((j) => j.link === jogadorLink);
  if (!jogador) return "401";
  return jogador.ranks[0].rank;
}

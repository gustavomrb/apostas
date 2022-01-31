import puppeteer from "puppeteer";
import fs from "fs";

let timesJson = [];
try {
  timesJson = fs.readFileSync("./geradores/futebol/times.json");
  timesJson = JSON.parse(timesJson);
} catch (e) {
  if (e.code !== "ENOENT") {
    throw err;
  }
}

let resultadosJson = [];
try {
  resultadosJson = fs.readFileSync("./geradores/futebol/resultados.json");
  resultadosJson = JSON.parse(resultadosJson);
} catch (e) {
  if (e.code !== "ENOENT") {
    throw err;
  }
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.flashscore.com/");
  await page.waitForSelector(".sportName.soccer");
  let jogos = [];
  let divs = await page.$$(".event__header");
  for (let divAtual of divs) {
    const paisCampeonato = await divAtual.$eval(".event__title--type", (n) => n.innerText);
    const nomeCampeonato = await divAtual.$eval(".event__title--name", (n) => n.innerText.split(" - ")[0]);
    if (
      paisCampeonato === "BRAZIL" &&
      (nomeCampeonato === "Campeonato Carioca" || nomeCampeonato === "Campeonato Paulista")
    ) {
      let nextSibling = await divAtual.getProperty("nextSibling");
      let nextSiblingClass = await nextSibling.evaluate((n) => n.className.split(" ")[1]);
      while (nextSiblingClass && nextSiblingClass.includes("event__match")) {
        if (nextSiblingClass === "event__match--scheduled") {
          let times = await nextSibling.$$eval(".event__participant", (nodes) => nodes.map((n) => n.innerText));
          const idJogo = await nextSibling.evaluate((n) => n.id.substring(4));
          const horario = await nextSibling.$eval(".event__time", (n) => n.innerText);
          const timeCasa = buscaTimeJson(times[0]);
          const timeFora = buscaTimeJson(times[1]);
          const jogo = {
            id: idJogo,
            campeonato: nomeCampeonato,
            casa: timeCasa,
            fora: timeFora,
            horario: horario,
          };
          jogos.push(jogo);
        }

        nextSibling = await nextSibling.getProperty("nextSibling");
        nextSiblingClass = nextSibling
          ? await nextSibling.evaluate((n) => {
              return n ? n.className.split(" ")[1] : null;
            })
          : null;
      }
    }
  }

  await adicionaIdsTimes(jogos, page);
  await adicionaResultadosTimes(jogos, page);

  let jsonJogosFinal = JSON.stringify(jogos, null, "  ");
  fs.writeFileSync("./geradores/futebol/jogosFut.json", jsonJogosFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  let jsonTimesFinal = JSON.stringify(timesJson, null, "  ");
  fs.writeFileSync("./geradores/futebol/times.json", jsonTimesFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  let jsonResultadosFinal = JSON.stringify(resultadosJson, null, "  ");
  fs.writeFileSync("./geradores/futebol/resultados.json", jsonResultadosFinal, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

async function adicionaIdsTimes(jogos, page) {
  for (let jogo of jogos) {
    if (!jogo.casa.id || !jogo.fora.id) {
      console.log("buscouIds");
      await page.goto("https://www.flashscore.com/match/" + jogo.id);
      await page.waitForSelector("a.participant__participantName");
      const links = await page.$$eval("a.participant__participantName", (nodes) =>
        nodes.map((n) => n.href.split("/team").at(-1))
      );
      jogo.casa.link = links[0];
      jogo.fora.link = links[1];
      jogo.casa.id = jogo.casa.link.split("/").at(-1);
      jogo.fora.id = jogo.fora.link.split("/").at(-1);
      timesJson.push(jogo.casa);
      timesJson.push(jogo.fora);
    }
  }
}

async function adicionaResultadosTimes(jogos, page) {
  for (let jogo of jogos) {
    if (!resultadosJson.find((r) => r.id === jogo.casa.id)) {
      console.log("buscouResultados");
      resultadosJson.push({
        id: jogo.casa.id,
        resultados: await adicionaResultadosTime(jogo.casa, page),
      });
    }

    if (!resultadosJson.find((r) => r.id === jogo.fora.id)) {
      console.log("buscouResultados");
      resultadosJson.push({
        id: jogo.fora.id,
        resultados: await adicionaResultadosTime(jogo.casa, page),
      });
    }
  }
}

async function adicionaResultadosTime(time, page) {
  const jogos = [];

  await page.goto(`https://www.flashscore.com/team${time.link}/results`);
  await page.waitForSelector(".sportName.soccer");

  let divs = await page.$$(".event__header");

  for (let divAtual of divs) {
    const nomeCampeonato = await divAtual.$eval(".event__title--name", (n) => n.innerText.split(" - ")[0]);
    let nextSibling = await divAtual.getProperty("nextSibling");
    let nextSiblingClass = await nextSibling.evaluate((n) => n.className.split(" ")[1]);
    while (nextSiblingClass && nextSiblingClass.includes("event__match")) {
      let times = await nextSibling.$$eval(".event__participant", (nodes) => nodes.map((n) => n.innerText));
      const data = await nextSibling.$eval(".event__time", (n) => n.innerText);
      const oponente = times.find((t) => t !== time.nome);
      const resultado = await nextSibling.$eval(".wld", (n) => n.innerText);
      const mando = times[0] === time.nome ? "casa" : "fora";
      const placarHome = await nextSibling.$eval(".event__score--home", (n) => n.innerText);
      const placarAway = await nextSibling.$eval(".event__score--away", (n) => n.innerText);
      const placar = `${placarHome}-${placarAway}`;
      const gols = parseInt(placarHome) + parseInt(placarAway);
      jogos.push({
        data: data,
        campeonato: nomeCampeonato,
        oponente: oponente,
        resultado: resultado,
        mando: mando,
        placar: placar,
        gols: gols,
      });

      nextSibling = await nextSibling.getProperty("nextSibling");
      nextSiblingClass = nextSibling
        ? await nextSibling.evaluate((n) => {
            return n ? n.className.split(" ")[1] : null;
          })
        : null;
    }
  }

  return jogos;
}

function buscaTimeJson(nomeTime) {
  const time = timesJson.find((t) => t.nome === nomeTime);
  return time ? time : { nome: nomeTime };
}

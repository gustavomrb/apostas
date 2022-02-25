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
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://www.flashscore.com/");
  await page.waitForSelector(".sportName.soccer");
  await page.waitForSelector("#onetrust-accept-btn-handler");
  (await page.$("#onetrust-accept-btn-handler")).click();

  let jogos = [];
  let divs = await page.$$(".event__header");
  for (let divAtual of divs) {
    const paisCampeonato = await divAtual.$eval(".event__title--type", (n) => n.innerText);
    const nomeCampeonato = await divAtual.$eval(".event__title--name", (n) => n.innerText.split(" - ")[0]);
    const paisesCampeonato = [
      "TURKEY",
      "ENGLAND",
      "SPAIN",
      "CROATIA",
      "ITALY",
      "GERMANY",
      "NETHERLANDS",
      "PORTUGAL",
      "BRAZIL",
      "PERU",
      "BOLIVIA",
      "FRANCE",
      "CHILE",
      "URUGUAY",
      "COLOMBIA",
      "PARAGUAY",
    ];
    const nomesCampeonato = [
      "Super Lig",
      "Premier League",
      "LaLiga",
      "1. HNL",
      "Serie A",
      "Bundesliga",
      "Eredivisie",
      "Liga Portugal",
      "Campeonato Cearense",
      "Campeonato Mineiro",
      "Liga 1",
      "Division Profesional",
      "Campeonato Baiano",
      "Campeonato Capixaba",
      "Campeonato Paulista",
      "Campeonato Sergipano",
      "Copa do Nordeste",
      "Campeonato Amazonense",
      "Campeonato Catarinense",
      "Campeonato Gaucho",
      "Campeonato Goiano",
      "Ligue 1",
      "Primera Division",
      "Primera A",
    ];
    if (paisesCampeonato.includes(paisCampeonato) && nomesCampeonato.includes(nomeCampeonato)) {
      const abaFechada = await divAtual.$(".event__expander--close");
      if (abaFechada) {
        await divAtual.click();
        await page.waitForTimeout(1000);
      }
      let nextSibling = await divAtual.getProperty("nextSibling");
      let nextSiblingClass = await nextSibling.evaluate((n) => n.className.split(" ")[1]);
      while (nextSiblingClass && nextSiblingClass.includes("event__match")) {
        if (nextSiblingClass === "event__match--scheduled") {
          let times = await nextSibling.$$eval(".event__participant", (nodes) =>
            nodes.map((n) => n.innerText.split(" (")[0])
          );
          const idJogo = await nextSibling.evaluate((n) => n.id.substring(4));
          const horario = (await nextSibling.$(".event__time"))
            ? await nextSibling.$eval(".event__time", (n) => n.innerText)
            : null;
          const timeCasa = buscaTimeJson(times[0], paisCampeonato);
          const timeFora = buscaTimeJson(times[1], paisCampeonato);
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

  jogos.sort((a, b) => (a.horario > b.horario ? 1 : -1));
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
        resultados: await adicionaResultadosTime(jogo.fora, page),
      });
    }
  }
}

async function adicionaResultadosTime(time, page) {
  const jogos = [];

  await page.goto(`https://www.flashscore.com/team${time.link}/results`);
  await page.waitForSelector(".sportName.soccer");

  if (await page.$("#onetrust-accept-btn-handler")) {
    await (await page.$("#onetrust-accept-btn-handler")).click();
  }

  let divs = await page.$$(".event__header");

  for (let i = 0; i < divs.length; i++) {
    const divAtual = divs[i];
    let numJogos = (await page.$$(".event__match")).length;
    const nomeCampeonato = await divAtual.$eval(".event__title--name", (n) => n.innerText.split(" - ")[0]);
    let nextSibling = await divAtual.getProperty("nextSibling");
    let nextSiblingClass = await nextSibling.evaluate((n) => n.className.split(" ")[1]);
    while (nextSiblingClass && nextSiblingClass.includes("event__match")) {
      let times = await nextSibling.$$eval(".event__participant", (nodes) =>
        nodes.map((n) => n.innerText.split(" (")[0])
      );
      let data = await nextSibling.$eval(".event__time", (n) => n.innerText);
      if (data.split(".")[2].includes(":")) {
        data = `${data.split(".")[0]}.${data.split(".")[1]}.${new Date().getFullYear()}`;
      } else if (data.split(".")[2].length > 4) {
        data = `${data.split(".")[0]}.${data.split(".")[1]}.${data.split(".")[2].split("\n")[0]}`;
      }
      const oponente = times.find((t) => t !== time.nome);
      const resultado = await nextSibling.$eval(".wld", (n) => n.innerText);
      const mando = times[0] === time.nome ? "casa" : "fora";

      const placarHome = parseInt(await nextSibling.$eval(".event__score--home", (n) => n.innerText));
      const placarAway = parseInt(await nextSibling.$eval(".event__score--away", (n) => n.innerText));
      const placar = `${placarHome}-${placarAway}`;
      const gols = placarHome + placarAway;
      const btts = placarHome > 0 && placarAway > 0;
      const margem = Math.abs(placarHome - placarAway);

      let fh = null;
      let sh = null;
      let htft = null;
      if (await nextSibling.$(".event__part--home")) {
        const placarHomeHalf = parseInt(
          await nextSibling.$eval(".event__part--home", (n) => n.innerText.replace("(", "").replace(")", ""))
        );
        const placarAwayHalf = parseInt(
          await nextSibling.$eval(".event__part--away", (n) => n.innerText.replace("(", "").replace(")", ""))
        );
        const placarHalf = `${placarHomeHalf}-${placarAwayHalf}`;
        const golsHalf = placarHomeHalf + placarAwayHalf;
        const bttsHalf = placarHomeHalf > 0 && placarAwayHalf > 0;
        const margemHalf = Math.abs(placarHomeHalf - placarAwayHalf);
        const resultadoHalf =
          mando === "casa"
            ? placarHomeHalf > placarAwayHalf
              ? "W"
              : placarHomeHalf < placarAwayHalf
              ? "L"
              : "D"
            : placarHomeHalf < placarAwayHalf
            ? "W"
            : placarHomeHalf > placarAwayHalf
            ? "L"
            : "D";

        const placarHomeSecond = placarHome - placarHomeHalf;
        const placarAwaySecond = placarAway - placarAwayHalf;
        const placarSecond = `${placarHomeSecond}-${placarAwaySecond}`;
        const golsSecond = placarHomeSecond + placarAwaySecond;
        const bttsSecond = placarHomeSecond > 0 && placarAwaySecond > 0;
        const margemSecond = Math.abs(placarHomeSecond - placarAwaySecond);
        const resultadoSecond =
          mando === "casa"
            ? placarHomeSecond > placarAwaySecond
              ? "W"
              : placarHomeSecond < placarAwaySecond
              ? "L"
              : "D"
            : placarHomeSecond < placarAwaySecond
            ? "W"
            : placarHomeSecond > placarAwaySecond
            ? "L"
            : "D";

        htft = `${resultadoHalf}-${resultado}`;

        fh = { resultado: resultadoHalf, placar: placarHalf, gols: golsHalf, btts: bttsHalf, margem: margemHalf };
        sh = {
          resultado: resultadoSecond,
          placar: placarSecond,
          gols: golsSecond,
          btts: bttsSecond,
          margem: margemSecond,
        };
      }

      jogos.push({
        data: data,
        campeonato: nomeCampeonato,
        oponente: oponente,
        mando: mando,
        ft: { resultado: resultado, placar: placar, gols: gols, btts: btts, htft: htft, margem: margem },
        fh: fh,
        sh: sh,
      });

      nextSibling = await nextSibling.getProperty("nextSibling");
      nextSiblingClass = nextSibling
        ? await nextSibling.evaluate((n) => {
            return n ? n.className.split(" ")[1] : null;
          })
        : null;

      if (
        nextSiblingClass &&
        nextSiblingClass.includes("event__more") &&
        new Date().getFullYear() - parseInt(data.split(".").at(-1)) <= 2
      ) {
        await page.waitForSelector(".event__more");
        (await page.$(".event__more")).click();
        console.log("clicou");
        await page.waitForFunction(
          (numJogos) => document.querySelectorAll(".event__match").length > numJogos,
          {},
          numJogos
        );
        console.log("passou wait network idle");
        nextSibling = (await page.$$(".event__match"))[numJogos];
        nextSiblingClass = nextSibling
          ? await nextSibling.evaluate((n) => {
              return n ? n.className.split(" ")[1] : null;
            })
          : null;
        console.log(nextSiblingClass);
        numJogos = (await page.$$(".event__match")).length;
        divs = await page.$$(".event__header");
        console.log(divs.length);
        console.log(numJogos);
        console.log("passou next sibling");
      }
    }
  }

  return jogos;
}

function buscaTimeJson(nomeTime, nomePais) {
  const time = timesJson.find((t) => t.nome === nomeTime && t.pais === nomePais);
  if (time && !time.pais) time.pais = nomePais;
  return time ? time : { nome: nomeTime, pais: nomePais };
}

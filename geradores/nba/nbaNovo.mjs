import fs from "fs";
import fetch from "node-fetch";
import {
  converterPraProbabilidade,
  geraParametrosNba,
  geraOptionsNba,
  timesNBA,
  listaProps,
  propNamesNovo,
} from "../utils.js";
import _ from "lodash";
import moment from "moment-timezone";

const jogadoresLinks = JSON.parse(fs.readFileSync("./geradores/nba/jogadoresComId.json"));
const defenseVsPosition = JSON.parse(fs.readFileSync("./geradores/nba/defenseVsPosition.json"));
const games = JSON.parse(fs.readFileSync("./games.json"));

let jogosDoDia = [];
try {
  jogosDoDia = fs.readFileSync("C:\\Users\\Gustavo\\Documents\\Projects\\apostas-nba-react\\src\\jogosDoDia.json");
  jogosDoDia = JSON.parse(jogosDoDia);
} catch (e) {
  if (e.code !== "ENOENT") {
    throw err;
  }
}

(async () => {
  for (let game of games) {
    let jogadores = [];
    let jogo = {};
    jogo.id = 1;
    jogo.times = [
      timesNBA.find((t) => t.nomeBet === game["timeFora"]),
      timesNBA.find((t) => t.nomeBet === game["timeCasa"]),
    ];
    jogo.horario = "10:00";
    jogo.mercado = {};
    jogo.mercado.playerProps = [];
    jogo.playerStats = [];
    for (let propPropertyName in game["odds"]["playerProps"]) {
      const nbaPropName = propNamesNovo[propPropertyName];
      const jogadoresArr = [];
      for (let playerPropJson of game["odds"]["playerProps"][propPropertyName]) {
        const propJogador = geraProp(playerPropJson, jogo.times, nbaPropName);
        if (propJogador) {
          jogadoresArr.push(propJogador);
          if (!jogadores.find((j) => j.jogador === propJogador.jogador && j.time === propJogador.time)) {
            jogadores.push({ jogador: propJogador.jogador, time: propJogador.time });
          }
        }
      }
      jogo.mercado.playerProps.push({ nome: propPropertyName, jogadores: jogadoresArr });
    }
    jogo.mercado.playerProps.sort((a, b) => listaProps.indexOf(a.nome) - listaProps.indexOf(b.nome));

    let mediasJogadores = null;

    console.log("Buscou Medias");
    mediasJogadores = await obterMediaStatsJogadorTime(jogo.times[0].id);
    mediasJogadores = mediasJogadores.concat(await obterMediaStatsJogadorTime(jogo.times[1].id));
    console.log("Terminou buscas");

    const playerStats = [];
    for (let jogador of jogadores) {
      let nomeJogador = jogador.jogador;
      let nomeTime = jogador.time;
      let jogadorId = jogadoresLinks.find((j) => j.nomeCompleto == nomeJogador && j.time == nomeTime).id;
      if (jogadorId) {
        let statsJogador = {};

        let boxScores = null;
        let boxScoresUltima = null;
        boxScores = await obterBoxScoresJogador(jogadorId, "2024-25", "Regular Season");
        boxScoresUltima = [];
        //boxScoresUltima = await obterBoxScoresJogador(jogadorId, "2023-24", "Regular Season");
        //boxScores = boxScoresUltima.concat(boxScores);

        statsJogador.geral = {};
        statsJogador.geral.medias = mediasJogadores.find((mj) => mj.player_id == jogadorId);
        statsJogador.geral.boxScores = boxScores;
        statsJogador.geral.boxScoresUltima = boxScoresUltima;

        statsJogador.ultimos5 = {};
        statsJogador.ultimos5.geral = {};
        statsJogador.ultimos5.geral.boxScores = boxScores ? boxScores.slice(0, 5) : null;
        statsJogador.ultimos5.geral.medias = geraMediasPorBoxScores(statsJogador.ultimos5.geral.boxScores);

        statsJogador.ultimos5.casa = {};
        statsJogador.ultimos5.casa.boxScores = boxScores
          ? boxScores.filter((b) => b.matchup.includes("vs.")).slice(0, 5)
          : null;
        statsJogador.ultimos5.casa.medias = geraMediasPorBoxScores(statsJogador.ultimos5.casa.boxScores);

        statsJogador.ultimos5.fora = {};
        statsJogador.ultimos5.fora.boxScores = boxScores
          ? boxScores.filter((b) => b.matchup.includes("@")).slice(0, 5)
          : null;
        statsJogador.ultimos5.fora.medias = geraMediasPorBoxScores(statsJogador.ultimos5.fora.boxScores);

        for (let prop of listaProps) {
          geraPropsJogadores(prop, nomeJogador, statsJogador, jogo);
        }
        playerStats.push({ jogador: nomeJogador, ...statsJogador });
      }
    }
    jogo.playerStats = playerStats;

    jogosDoDia.push(jogo);
  }
  let jsonJogoFinal = JSON.stringify(jogosDoDia, null, "  ");
  fs.writeFileSync(
    "C:\\Users\\Gustavo\\Documents\\Projects\\apostas-nba-react\\src\\jogosDoDia.json",
    jsonJogoFinal,
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
})();

function geraProp(playerPropJson, times, propName) {
  console.log(playerPropJson.player);
  const jogador = jogadoresLinks.find((j) => playerPropJson.player === j.nomeCompleto);
  const time = jogador.time;
  const timeAdversario = times.find((t) => t.nomeBet !== playerPropJson.team).nomeCurto;
  const oddsOver = playerPropJson.overOdd;
  const oddsUnder = playerPropJson.underOdd;
  const gradeOver = "A";
  const gradeUnder = "A";
  //const rankDefenseVsPosition = defenseVsPosition[propName]
  //  ? defenseVsPosition[propName][jogador.posicao].find((d) => d.time === timeAdversario)
  //  : null;

  return {
    jogador: jogador.nomeCompleto,
    time: time,
    limite: playerPropJson.prop,
    oddsOver: oddsOver,
    oddsOverImplicita: converterPraProbabilidade(oddsOver),
    oddsUnder: oddsUnder,
    oddsUnderImplicita: converterPraProbabilidade(oddsUnder),
    gradeOver: gradeOver,
    gradeUnder: gradeUnder,
    //defenseVsPosition: rankDefenseVsPosition ? `${rankDefenseVsPosition.valor} (${rankDefenseVsPosition.rank})` : null,
  };
}

function geraPropsJogadores(nomeProp, nomeJogador, statsJogador, jogo) {
  let propAtributo = jogo.mercado.playerProps.find((p) => propNamesNovo[p.nome] == nomeProp);
  let propAtributoJogador = propAtributo ? propAtributo.jogadores.find((p) => p.jogador == nomeJogador) : null;
  if (propAtributoJogador && statsJogador.geral.medias) {
    let numJogos = statsJogador.geral.medias["gp"];
    let propsArr = nomeProp.split(/(?=[A-Z])/);
    propsArr = propsArr.map((p) => p.toLowerCase());
    propAtributoJogador.media = propsArr.reduce((prev, curr) => prev + statsJogador.geral.medias[curr], 0).toFixed(1);

    const acimaLimite = statsJogador.geral.boxScores.filter(
      (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
    ).length;

    const acimaLimiteUltima = statsJogador.geral.boxScoresUltima.filter(
      (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
    ).length;

    const taxaAcerto = acimaLimite / numJogos;
    const taxaAcertoUltima =
      statsJogador.geral.boxScoresUltima.length > 0 ? acimaLimiteUltima / statsJogador.geral.boxScoresUltima.length : 0;
    let taxaUltimos5 = null;
    let taxaUltimos10 = null;

    const pctAcerto = (taxaAcerto * 100).toFixed(1);
    const pctErro = (100 - pctAcerto).toFixed(1);

    propAtributoJogador.temporada = acimaLimite + "/" + numJogos;
    propAtributoJogador.temporadaUltima = acimaLimiteUltima + "/" + statsJogador.geral.boxScoresUltima.length;
    propAtributoJogador.diferencaOver = (pctAcerto - propAtributoJogador.oddsOverImplicita).toFixed(2);
    propAtributoJogador.diferencaUnder = (pctErro - propAtributoJogador.oddsUnderImplicita).toFixed(2);

    const arrUltimos5 = statsJogador.geral.boxScores.length >= 5 ? statsJogador.geral.boxScores.slice(0, 5) : null;
    const arrUltimos10 = statsJogador.geral.boxScores.length >= 10 ? statsJogador.geral.boxScores.slice(0, 10) : null;

    if (arrUltimos5) {
      const acimaLimiteUltimos = arrUltimos5.filter(
        (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
      ).length;
      propAtributoJogador.ultimos5 = acimaLimiteUltimos + "/" + 5;
      taxaUltimos5 = acimaLimiteUltimos / 5;
    } else {
      propAtributoJogador.ultimos5 = propAtributoJogador.temporada;
      taxaUltimos5 = taxaAcerto;
    }

    if (arrUltimos10) {
      const acimaLimiteUltimos = arrUltimos10.filter(
        (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
      ).length;
      propAtributoJogador.ultimos10 = acimaLimiteUltimos + "/" + 10;
      taxaUltimos10 = acimaLimiteUltimos / 10;
    } else {
      propAtributoJogador.ultimos10 = propAtributoJogador.temporada;
      taxaUltimos10 = taxaAcerto;
    }

    const taxaFinal = taxaAcerto * 0.3 + taxaUltimos10 * 0.35 + taxaUltimos5 * 0.35;
    const taxaFinalErro = 1 - taxaFinal;
    propAtributoJogador.taxaFinal = (taxaFinal * 100).toFixed(1);
    propAtributoJogador.taxaFinalErro = (taxaFinalErro * 100).toFixed(1);
    propAtributoJogador.diferencaOverFinal = (
      propAtributoJogador.taxaFinal - propAtributoJogador.oddsOverImplicita
    ).toFixed(2);
    propAtributoJogador.diferencaUnderFinal = (
      propAtributoJogador.taxaFinalErro - propAtributoJogador.oddsUnderImplicita
    ).toFixed(2);
    propAtributoJogador.taxaFinal = propAtributoJogador.taxaFinal + "%";
    propAtributoJogador.taxaFinalErro = propAtributoJogador.taxaFinalErro + "%";
  }
}

async function obterMediaStatsJogadorTime(timeId) {
  let res = await fetch(
    "https://stats.nba.com/stats/leaguedashplayerstats?" + geraParametrosNba({ Season: "2024-25" }),
    geraOptionsNba()
  );
  let jsonResposta = await res.json();
  jsonResposta = jsonResposta.resultSets[0];

  let statsJogador = jsonResposta.rowSet.map((el) => {
    let res = el.reduce((obj, curr, i) => {
      if (i === 1) {
        return { [jsonResposta.headers[0].toLowerCase()]: obj, [jsonResposta.headers[1].toLowerCase()]: curr };
      }
      return { ...obj, [jsonResposta.headers[i].toLowerCase()]: curr };
    });
    return _.pick(res, [
      "player_id",
      "gp",
      "min",
      "fgm",
      "fga",
      "fg_pct",
      "fg3m",
      "fg3a",
      "fg3_pct",
      "ftm",
      "fta",
      "ft_pct",
      "oreb",
      "dreb",
      "reb",
      "ast",
      "tov",
      "stl",
      "blk",
      "pf",
      "pts",
    ]);
  });

  return statsJogador;
}

async function obterBoxScoresJogador(jogadorId, season, seasonType) {
  console.log("Buscou boxscore");
  let res = await fetch(
    "https://stats.nba.com/stats/playergamelogs?" +
      geraParametrosNba({ PlayerID: jogadorId, Season: season, SeasonType: seasonType }),
    geraOptionsNba()
  );
  let jsonResposta = await res.json();
  jsonResposta = jsonResposta.resultSets[0];

  let statsJogador = jsonResposta.rowSet.map((el) => {
    let res = el.reduce((obj, curr, i) => {
      if (i === 1) {
        return { [jsonResposta.headers[0].toLowerCase()]: obj, [jsonResposta.headers[1].toLowerCase()]: curr };
      }
      return { ...obj, [jsonResposta.headers[i].toLowerCase()]: curr };
    });
    return _.pick(res, [
      "matchup",
      "wl",
      "min",
      "fgm",
      "fga",
      "fg_pct",
      "fg3m",
      "fg3a",
      "fg3_pct",
      "ftm",
      "fta",
      "ft_pct",
      "oreb",
      "dreb",
      "reb",
      "ast",
      "tov",
      "stl",
      "blk",
      "pf",
      "pts",
    ]);
  });

  console.log("Terminou boxscore");

  return statsJogador;
}

function geraMediasPorBoxScores(boxScores) {
  const stats = [
    "min",
    "fgm",
    "fga",
    "fg3m",
    "fg3a",
    "ftm",
    "fta",
    "oreb",
    "dreb",
    "reb",
    "ast",
    "stl",
    "blk",
    "tov",
    "pts",
  ];

  const retorno = {};
  retorno.gp = boxScores.length;

  for (let stat of stats) {
    let soma = boxScores.reduce((accum, curr) => accum + curr[stat], 0);
    retorno[stat] = (soma / retorno.gp).toFixed(1);
  }

  retorno.fg_pct = (retorno["fgm"] / retorno["fga"]).toFixed(3);
  retorno.fg3_pct = (retorno["fg3m"] / retorno["fg3a"]).toFixed(3);
  retorno.ft_pct = (retorno["ftm"] / retorno["fta"]).toFixed(3);

  return retorno;
}

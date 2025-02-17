import fs from "fs";
import fetch from "node-fetch";
import {
  converterParaDecimal,
  converterPraProbabilidade,
  geraParametrosNba,
  geraOptionsNba,
  timesNBA,
  listaProps,
  geraOptionsAction,
  propNames,
} from "../utils.js";
import _ from "lodash";
import moment from "moment-timezone";

const jogadoresLinks = JSON.parse(fs.readFileSync("./geradores/nba/jogadoresComId.json"));
const defenseVsPosition = JSON.parse(fs.readFileSync("./geradores/nba/defenseVsPosition.json"));
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
  const idJogos = [205533, 205534, 205535];
  for (let idJogo of idJogos) {
    let jogoAnterior = jogosDoDia.find((j) => j.id === idJogo);
    const jogo = jogoAnterior ? jogoAnterior : {};
    const jogoJson = await obterJogo(idJogo);
    const propsJson = await obterProps(idJogo);
    let jogadores = [];
    if (jogoJson && propsJson) {
      jogo.id = idJogo;
      jogo.times = [
        timesNBA.find((t) => t.nome === jogoJson.teams[0].full_name),
        timesNBA.find((t) => t.nome === jogoJson.teams[1].full_name),
      ];
      const horarioString = moment(jogoJson.start_time).tz("America/Sao_Paulo");
      jogo.horario = horarioString.format("HH:mm");
      jogo.mercado = {};
      jogo.mercado.playerProps = [];
      jogo.playerStats = jogoAnterior ? jogoAnterior.playerStats : [];
      for (let propPropertyName in propsJson["player_props"]) {
        const propNameArr = propPropertyName.split("_");
        const jsonPropName =
          propNameArr.length === 5
            ? propNameArr[4]
            : propNameArr.length === 6
            ? `${propNameArr[4]}_${propNameArr[5]}`
            : `${propNameArr[4]}_${propNameArr[5]}_${propNameArr[6]}`;
        const nbaPropName = propNames[jsonPropName];
        if (nbaPropName !== "dd2" && nbaPropName !== "td3") {
          const jogadoresArr = [];
          for (let playerPropJson of propsJson["player_props"][propPropertyName]) {
            const propJogador = geraProp(playerPropJson, jogoJson.teams, propsJson["players"], nbaPropName);
            if (propJogador) {
              jogadoresArr.push(propJogador);
              if (!jogadores.find((j) => j.jogador === propJogador.jogador && j.time === propJogador.time)) {
                jogadores.push({ jogador: propJogador.jogador, time: propJogador.time });
              }
            }
          }
          jogo.mercado.playerProps.push({ nome: nbaPropName, jogadores: jogadoresArr });
        }
      }
      jogo.mercado.playerProps.sort((a, b) => listaProps.indexOf(a.nome) - listaProps.indexOf(b.nome));

      let mediasJogadores = null;
      let buscarMedias = true;
      if (jogoAnterior) {
        buscarMedias = false;
        for (let jogador of jogadores) {
          if (!jogoAnterior.playerStats.find((p) => p.jogador === jogador.jogador)) {
            buscarMedias = true;
            break;
          }
        }
      }
      if (!buscarMedias) {
        mediasJogadores = jogoAnterior.playerStats.map((p) => p.geral.medias);
      } else {
        console.log("Buscou Medias");
        mediasJogadores = await obterMediaStatsJogadorTime(jogo.times[0].id);
        mediasJogadores = mediasJogadores.concat(await obterMediaStatsJogadorTime(jogo.times[1].id));
        console.log("Terminou buscas");
      }

      const playerStats = [];
      for (let jogador of jogadores) {
        let nomeJogador = jogador.jogador;
        let nomeTime = jogador.time;
        let jogadorId = jogadoresLinks.find((j) => j.nomeCompleto == nomeJogador && j.time == nomeTime).id;
        if (jogadorId) {
          let statsJogador = {};

          let boxScores = null;
          let boxScoresUltima = null;
          if (jogoAnterior) {
            const jogadorAnterior = jogoAnterior.playerStats.find((p) => p.jogador === nomeJogador);
            boxScores = jogadorAnterior
              ? jogadorAnterior.geral.boxScores
              : await obterBoxScoresJogador(jogadorId, "2023-24");
            boxScoresUltima = jogadorAnterior
              ? jogadorAnterior.geral.boxScoresUltima
              : await obterBoxScoresJogador(jogadorId, "2022-23");
          } else {
            boxScores = await obterBoxScoresJogador(jogadorId, "2023-24");
            boxScoresUltima = await obterBoxScoresJogador(jogadorId, "2022-23");
          }

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

      if (!jogoAnterior) {
        jogosDoDia.push(jogo);
      }
    }
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

async function obterProps(idJogo) {
  const res = await fetch("https://api.actionnetwork.com/web/v1/games/" + idJogo + "/props", geraOptionsAction());
  const json = await res.json();
  return json;
}

async function obterJogo(idJogo) {
  const res = await fetch("https://api.actionnetwork.com/web/v1/games/" + idJogo + "/polling", geraOptionsAction());
  const json = await res.json();
  return json;
}

function geraProp(playerPropJson, timesJson, playersJson, propName) {
  if (!playerPropJson.odds["15"]) return null;
  const playerJson = playersJson[playerPropJson.player_id];
  const time = timesJson.find((t) => t.id === playerJson.team_id).abbr;
  const timeAdversario = timesJson.find((t) => t.id !== playerJson.team_id).abbr;
  const oddsOver = converterParaDecimal(playerPropJson.odds["15"][0].money);
  const oddsUnder = converterParaDecimal(playerPropJson.odds["15"][1].money);
  const gradeOver = playerPropJson.odds["15"][0].grade;
  const gradeUnder = playerPropJson.odds["15"][1].grade;
  const jogador = jogadoresLinks.find((j) => playerJson.player_abbr.trim() === j.nome && time === j.time);
  console.log(playerJson.player_abbr.trim());
  const rankDefenseVsPosition = defenseVsPosition[propName]
    ? defenseVsPosition[propName][jogador.posicao].find((d) => d.time === timeAdversario)
    : null;

  return {
    jogador: jogador.nomeCompleto,
    time: time,
    limite: playerPropJson.odds["15"][0].value,
    oddsOver: oddsOver,
    oddsOverImplicita: converterPraProbabilidade(oddsOver),
    oddsUnder: oddsUnder,
    oddsUnderImplicita: converterPraProbabilidade(oddsUnder),
    gradeOver: gradeOver,
    gradeUnder: gradeUnder,
    defenseVsPosition: rankDefenseVsPosition ? `${rankDefenseVsPosition.valor} (${rankDefenseVsPosition.rank})` : null,
  };
}

function geraPropsJogadores(nomeProp, nomeJogador, statsJogador, jogo) {
  let propAtributo = jogo.mercado.playerProps.find((p) => p.nome == nomeProp);
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

    const pctAcerto = ((acimaLimite / numJogos) * 100).toFixed(1);
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
    } else {
      propAtributoJogador.ultimos5 = propAtributoJogador.temporada;
    }

    if (arrUltimos10) {
      const acimaLimiteUltimos = arrUltimos10.filter(
        (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
      ).length;
      propAtributoJogador.ultimos10 = acimaLimiteUltimos + "/" + 10;
    } else {
      propAtributoJogador.ultimos10 = propAtributoJogador.temporada;
    }
  }
}

async function obterMediaStatsJogadorTime(timeId) {
  let res = await fetch(
    "https://stats.nba.com/stats/leaguedashplayerstats?" + geraParametrosNba({ Season: "2023-24" }),
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

async function obterBoxScoresJogador(jogadorId, season) {
  console.log("Buscou boxscore");
  let res = await fetch(
    "https://stats.nba.com/stats/playergamelogs?" + geraParametrosNba({ PlayerID: jogadorId, Season: season }),
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

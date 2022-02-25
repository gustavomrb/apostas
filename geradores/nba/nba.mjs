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
  const idJogos = [108707, 108709];
  for (let idJogo of idJogos) {
    let jogoAnterior = jogosDoDia.find((j) => j.id === idJogo);
    const jogo = jogoAnterior ? jogoAnterior : {};
    const jogoJson = await obterJogo(idJogo);
    if (jogoJson.player_props) {
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
      for (let playerPropJson of jogoJson.player_props) {
        const propertyName = propNames[playerPropJson.custom_pick_type_display_name];
        if (propertyName !== "dd2" && propertyName !== "td3") {
          let playerProp = jogo.mercado.playerProps.find((p) => p.nome === propertyName);
          if (!playerProp) {
            playerProp = { nome: propertyName, jogadores: [] };
            jogo.mercado.playerProps.push(playerProp);
          }
          playerProp.jogadores.push(geraProp(playerPropJson, jogoJson.teams));
        }
      }
      jogo.mercado.playerProps.sort((a, b) => listaProps.indexOf(a.nome) - listaProps.indexOf(b.nome));

      let jogadores = jogo.mercado.playerProps.find((p) => p.nome == "pts").jogadores;

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
          if (jogoAnterior) {
            const jogadorAnterior = jogoAnterior.playerStats.find((p) => p.jogador === nomeJogador);
            boxScores = jogadorAnterior ? jogadorAnterior.geral.boxScores : await obterBoxScoresJogador(jogadorId);
          } else {
            boxScores = await obterBoxScoresJogador(jogadorId);
          }

          statsJogador.geral = {};
          statsJogador.geral.medias = mediasJogadores.find((mj) => mj.player_id == jogadorId);
          statsJogador.geral.boxScores = boxScores;

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

async function obterJogo(idJogo) {
  const res = await fetch("https://api.actionnetwork.com/web/v1/games/" + idJogo, geraOptionsAction());
  const json = await res.json();
  return json;
}

function geraProp(playerPropJson, timesJson) {
  const time = timesJson.find((t) => t.id === playerPropJson.team_id).abbr;
  const oddsOver = converterParaDecimal(playerPropJson.lines[0].money);
  const oddsUnder = converterParaDecimal(playerPropJson.lines[1].money);

  return {
    jogador: jogadoresLinks.find((j) => playerPropJson.player_abbr === j.nome && time === j.time).nomeCompleto,
    time: time,
    limite: playerPropJson.lines[0].value,
    oddsOver: oddsOver,
    oddsOverImplicita: converterPraProbabilidade(oddsOver),
    oddsUnder: oddsUnder,
    oddsUnderImplicita: converterPraProbabilidade(oddsUnder),
  };
}

function geraPropsJogadores(nomeProp, nomeJogador, statsJogador, jogo) {
  let propAtributo = jogo.mercado.playerProps.find((p) => p.nome == nomeProp);
  let propAtributoJogador = propAtributo ? propAtributo.jogadores.find((p) => p.jogador == nomeJogador) : null;
  if (propAtributoJogador) {
    let numJogos = statsJogador.geral.medias["gp"];
    let propsArr = nomeProp.split(/(?=[A-Z])/);
    propsArr = propsArr.map((p) => p.toLowerCase());
    propAtributoJogador.media = propsArr.reduce((prev, curr) => prev + statsJogador.geral.medias[curr], 0).toFixed(1);

    const acimaLimite = statsJogador.geral.boxScores.filter(
      (p) => propsArr.reduce((prev, curr) => prev + p[curr], 0) > propAtributoJogador.limite
    ).length;

    const pctAcerto = ((acimaLimite / numJogos) * 100).toFixed(1);
    const pctErro = (100 - pctAcerto).toFixed(1);
    propAtributoJogador.temporada = acimaLimite + "/" + numJogos;
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
    "https://stats.nba.com/stats/leaguedashplayerstats?" + geraParametrosNba({ TeamID: timeId }),
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

async function obterBoxScoresJogador(jogadorId) {
  console.log("Buscou boxscore");
  let res = await fetch(
    "https://stats.nba.com/stats/playergamelogs?" + geraParametrosNba({ PlayerID: jogadorId }),
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

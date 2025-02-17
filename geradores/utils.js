const propNames = {
  points: "pts",
  rebounds: "reb",
  assists: "ast",
  "3fgm": "fg3m",
  points_rebounds_assists: "ptsRebAst",
  points_rebounds: "ptsReb",
  rebounds_assists: "rebAst",
  points_assists: "ptsAst",
  "triple-double": "td3",
  "double-double": "dd2",
  steals: "stl",
  blocks: "blk",
  steals_blocks: "stlBlk",
};

const propNamesNovo = {
  Pontos: "pts",
  Rebotes: "reb",
  Assistencias: "ast",
  "Cestas de 3 Convertidas": "fg3m",
  "Pontos, Assistencias e Rebotes": "ptsRebAst",
  "Pontos e Rebotes": "ptsReb",
  "Assistencias e Rebotes": "rebAst",
  "Pontos e Assistencias": "ptsAst",
  "triple-double": "td3",
  "double-double": "dd2",
  Roubos: "stl",
  Tocos: "blk",
  "Roubos e Tocos": "stlBlk",
  "Inversao de Posse de Bola": "tov",
};

const listaProps = [
  "pts",
  "reb",
  "ast",
  "fg3m",
  "stl",
  "blk",
  "ptsRebAst",
  "ptsReb",
  "ptsAst",
  "rebAst",
  "stlBlk",
  "tov",
];

const converterParaDecimal = (american) => {
  let valor = parseInt(american);
  valor = valor > 0 ? 1 + valor / 100 : 1 - 100 / valor;
  return valor.toFixed(2);
};

const converterPraProbabilidade = (decimalOdd) => {
  return ((1 / parseFloat(decimalOdd)) * 100).toFixed(1);
};

const geraParametrosNba = (parametrosArg) => {
  const parametros = {
    DateFrom: "",
    DateTo: "",
    GameSegment: "",
    LastNGames: "0",
    LeagueID: "00",
    Location: "",
    MeasureType: "Base",
    Month: "0",
    OpponentTeamID: "0",
    Outcome: "",
    PaceAdjust: "N",
    PerMode: "PerGame",
    Period: "0",
    PlayerID: "",
    PlusMinus: "N",
    Rank: "N",
    Season: "",
    SeasonSegment: "",
    SeasonType: "Regular Season",
    TeamID: "",
    VsConference: "",
    VsDivision: "",
    GameScope: "",
    PlayerExperience: "",
    PlayerPosition: "",
    StarterBench: "",
  };

  for (let param in parametrosArg) {
    parametros[param] = parametrosArg[param];
  }

  return new URLSearchParams(parametros);
};

const geraOptionsNba = () => {
  return {
    method: "GET",
    headers: {
      Host: "stats.nba.com",
      Connection: "keep-alive",
      "sec-ch-ua": "'Chromium';v='93', ' Not;A Brand';v='99'",
      Accept: "application/json, text/plain, */*",
      "x-nba-stats-token": "true",
      "sec-ch-ua-mobile": "?0",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.0 Safari/537.36",
      "x-nba-stats-origin": "stats",
      "sec-ch-ua-platform": "Windows",
      Origin: "https://www.nba.com",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      Referer: "https://www.nba.com/",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",
    },
  };
};

const geraOptionsAction = () => {
  return {
    method: "GET",
    headers: {
      accept: "application/json",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      origin: "https://www.actionnetwork.com",
      "user-agent": "node-fetch",
    },
  };
};

const timesNBA = [
  {
    nome: "Atlanta Hawks",
    nomeCurto: "ATL",
    id: "1610612737",
    nomeBet: "ATL Hawks",
  },
  {
    nome: "Boston Celtics",
    nomeCurto: "BOS",
    id: "1610612738",
    nomeBet: "BOS Celtics",
  },
  {
    nome: "Brooklyn Nets",
    nomeCurto: "BKN",
    id: "1610612751",
    nomeBet: "BKN Nets",
  },
  {
    nome: "Charlotte Hornets",
    nomeCurto: "CHA",
    id: "1610612766",
    nomeBet: "CHA Hornets",
  },
  {
    nome: "Chicago Bulls",
    nomeCurto: "CHI",
    id: "1610612741",
    nomeBet: "CHI Bulls",
  },
  {
    nome: "Cleveland Cavaliers",
    nomeCurto: "CLE",
    id: "1610612739",
    nomeBet: "CLE Cavaliers",
  },
  {
    nome: "Dallas Mavericks",
    nomeCurto: "DAL",
    id: "1610612742",
    nomeBet: "DAL Mavericks",
  },
  {
    nome: "Denver Nuggets",
    nomeCurto: "DEN",
    id: "1610612743",
    nomeBet: "DEN Nuggets",
  },
  {
    nome: "Detroit Pistons",
    nomeCurto: "DET",
    id: "1610612765",
    nomeBet: "DET Pistons",
  },
  {
    nome: "Golden State Warriors",
    nomeCurto: "GSW",
    id: "1610612744",
    nomeBet: "GS Warriors",
  },
  {
    nome: "Houston Rockets",
    nomeCurto: "HOU",
    id: "1610612745",
    nomeBet: "HOU Rockets",
  },
  {
    nome: "Indiana Pacers",
    nomeCurto: "IND",
    id: "1610612754",
    nomeBet: "IND Pacers",
  },
  {
    nome: "LA Clippers",
    nomeCurto: "LAC",
    id: "1610612746",
    nomeBet: "LA Clippers",
  },
  {
    nome: "Los Angeles Lakers",
    nomeCurto: "LAL",
    id: "1610612747",
    nomeBet: "LA Lakers",
  },
  {
    nome: "Memphis Grizzlies",
    nomeCurto: "MEM",
    id: "1610612763",
    nomeBet: "MEM Grizzlies",
  },
  {
    nome: "Miami Heat",
    nomeCurto: "MIA",
    id: "1610612748",
    nomeBet: "MIA Heat",
  },
  {
    nome: "Milwaukee Bucks",
    nomeCurto: "MIL",
    id: "1610612749",
    nomeBet: "MIL Bucks",
  },
  {
    nome: "Minnesota Timberwolves",
    nomeCurto: "MIN",
    id: "1610612750",
    nomeBet: "MIN Timberwolves",
  },
  {
    nome: "New Orleans Pelicans",
    nomeCurto: "NOP",
    id: "1610612740",
    nomeBet: "NO Pelicans",
  },
  {
    nome: "New York Knicks",
    nomeCurto: "NYK",
    id: "1610612752",
    nomeBet: "NY Knicks",
  },
  {
    nome: "Oklahoma City Thunder",
    nomeCurto: "OKC",
    id: "1610612760",
    nomeBet: "OKC Thunder",
  },
  {
    nome: "Orlando Magic",
    nomeCurto: "ORL",
    id: "1610612753",
    nomeBet: "ORL Magic",
  },
  {
    nome: "Philadelphia 76ers",
    nomeCurto: "PHI",
    id: "1610612755",
    nomeBet: "PHI 76ers",
  },
  {
    nome: "Phoenix Suns",
    nomeCurto: "PHO",
    id: "1610612756",
    nomeBet: "PHX Suns",
  },
  {
    nome: "Portland Trail Blazers",
    nomeCurto: "POR",
    id: "1610612757",
    nomeBet: "POR Trail Blazers",
  },
  {
    nome: "Sacramento Kings",
    nomeCurto: "SAC",
    id: "1610612758",
    nomeBet: "SAC Kings",
  },
  {
    nome: "San Antonio Spurs",
    nomeCurto: "SAS",
    id: "1610612759",
    nomeBet: "SA Spurs",
  },
  {
    nome: "Toronto Raptors",
    nomeCurto: "TOR",
    id: "1610612761",
    nomeBet: "TOR Raptors",
  },
  {
    nome: "Utah Jazz",
    nomeCurto: "UTA",
    id: "1610612762",
    nomeBet: "UTA Jazz",
  },
  {
    nome: "Washington Wizards",
    nomeCurto: "WAS",
    id: "1610612764",
    nomeBet: "WAS Wizards",
  },
];

module.exports = {
  propNames,
  propNamesNovo,
  converterParaDecimal,
  converterPraProbabilidade,
  geraParametrosNba,
  geraOptionsNba,
  timesNBA,
  listaProps,
  geraOptionsAction,
};

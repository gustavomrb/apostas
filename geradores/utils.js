const propNames = {
  Pts: "pts",
  Rebs: "reb",
  Ast: "ast",
  "3pt M": "fg3m",
  "Pts+Rebs+Ast": "ptsRebAst",
  "Pts+Rebs": "ptsReb",
  "Rebs+Ast": "rebAst",
  "Pts+Ast": "ptsAst",
  "Triple-Double": "td3",
  "Double-Double": "dd2",
  Stl: "stl",
  Blk: "blk",
  "Stl+Blk": "stlBlk",
};

const listaProps = ["pts", "reb", "ast", "fg3m", "stl", "blk", "ptsRebAst", "ptsReb", "ptsAst", "rebAst", "stlBlk"];

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
    Season: "2021-22",
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
  },
  {
    nome: "Boston Celtics",
    nomeCurto: "BOS",
    id: "1610612738",
  },
  {
    nome: "Brooklyn Nets",
    nomeCurto: "BKN",
    id: "1610612751",
  },
  {
    nome: "Charlotte Hornets",
    nomeCurto: "CHA",
    id: "1610612766",
  },
  {
    nome: "Chicago Bulls",
    nomeCurto: "CHI",
    id: "1610612741",
  },
  {
    nome: "Cleveland Cavaliers",
    nomeCurto: "CLE",
    id: "1610612739",
  },
  {
    nome: "Dallas Mavericks",
    nomeCurto: "DAL",
    id: "1610612742",
  },
  {
    nome: "Denver Nuggets",
    nomeCurto: "DEN",
    id: "1610612743",
  },
  {
    nome: "Detroit Pistons",
    nomeCurto: "DET",
    id: "1610612765",
  },
  {
    nome: "Golden State Warriors",
    nomeCurto: "GSW",
    id: "1610612744",
  },
  {
    nome: "Houston Rockets",
    nomeCurto: "HOU",
    id: "1610612745",
  },
  {
    nome: "Indiana Pacers",
    nomeCurto: "IND",
    id: "1610612754",
  },
  {
    nome: "Los Angeles Clippers",
    nomeCurto: "LAC",
    id: "1610612746",
  },
  {
    nome: "Los Angeles Lakers",
    nomeCurto: "LAL",
    id: "1610612747",
  },
  {
    nome: "Memphis Grizzlies",
    nomeCurto: "MEM",
    id: "1610612763",
  },
  {
    nome: "Miami Heat",
    nomeCurto: "MIA",
    id: "1610612748",
  },
  {
    nome: "Milwaukee Bucks",
    nomeCurto: "MIL",
    id: "1610612749",
  },
  {
    nome: "Minnesota Timberwolves",
    nomeCurto: "MIN",
    id: "1610612750",
  },
  {
    nome: "New Orleans Pelicans",
    nomeCurto: "NOP",
    id: "1610612740",
  },
  {
    nome: "New York Knicks",
    nomeCurto: "NYK",
    id: "1610612752",
  },
  {
    nome: "Oklahoma City Thunder",
    nomeCurto: "OKC",
    id: "1610612760",
  },
  {
    nome: "Orlando Magic",
    nomeCurto: "ORL",
    id: "1610612753",
  },
  {
    nome: "Philadelphia 76ers",
    nomeCurto: "PHI",
    id: "1610612755",
  },
  {
    nome: "Phoenix Suns",
    nomeCurto: "PHO",
    id: "1610612756",
  },
  {
    nome: "Portland Trail Blazers",
    nomeCurto: "POR",
    id: "1610612757",
  },
  {
    nome: "Sacramento Kings",
    nomeCurto: "SAC",
    id: "1610612758",
  },
  {
    nome: "San Antonio Spurs",
    nomeCurto: "SAS",
    id: "1610612759",
  },
  {
    nome: "Toronto Raptors",
    nomeCurto: "TOR",
    id: "1610612761",
  },
  {
    nome: "Utah Jazz",
    nomeCurto: "UTA",
    id: "1610612762",
  },
  {
    nome: "Washington Wizards",
    nomeCurto: "WAS",
    id: "1610612764",
  },
];

module.exports = {
  propNames,
  converterParaDecimal,
  converterPraProbabilidade,
  geraParametrosNba,
  geraOptionsNba,
  timesNBA,
  listaProps,
  geraOptionsAction,
};

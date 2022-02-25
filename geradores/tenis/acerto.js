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

for (let jogador of jogadoresJson) {
  let keys = Object.keys(jogador.ranks);
  let values = Object.values(jogador.ranks);

  const novosRanks = {};
  for (var i = keys.length; i >= 0; i--) {
    const dataAtual = keys[i];
    const rankAtual = values[i];
    const rankAnterior = values[i + 1];
    if (!rankAnterior || rankAtual !== rankAnterior) {
      novosRanks[dataAtual] = rankAtual;
    }
  }
  jogador.ranks = novosRanks;
}

let jsonRankingFinal = JSON.stringify(jogadoresJson, null, "  ");
fs.writeFileSync("./geradores/tenis/acertoRanking.json", jsonRankingFinal, (err) => {
  if (err) {
    console.error(err);
    return;
  }
});

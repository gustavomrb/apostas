var express = require("express");
var router = express.Router();

var jogosTenis = require("../geradores/tenis/jogosTenis.json");
var resultados = require("../geradores/tenis/resultados.json");

router.get("/jogos", function (req, res, next) {
  res.send(jogosTenis);
});

router.get("/jogo/:idJogo", function (req, res, next) {
  res.send(jogosTenis.find((j) => j.id === req.params.idJogo));
});

router.get("/resultados/:nomeJogador", function (req, res, next) {
  let resultadosTime = resultados.find((r) => r.player === req.params.nomeJogador).resultados;
  for (let param in req.query) {
    if (param === "data" && req.query.data) {
      resultadosTime = resultadosTime.filter((r) => req.query.data.includes(r.data.split("‑")[2]));
    } else if (param === "excluiOponente") {
      resultadosTime = resultadosTime.filter((r) => !req.query.excluiOponente.includes(r.oponente));
    } else if (req.query[param]) {
      resultadosTime = resultadosTime.filter((r) => req.query[param].includes(r[param]));
    }
  }
  res.send(resultadosTime);
});

module.exports = router;

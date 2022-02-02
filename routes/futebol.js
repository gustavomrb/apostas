var express = require("express");
var router = express.Router();

var jogosFutebol = require("../geradores/futebol/jogosFut.json");
var resultados = require("../geradores/futebol/resultados.json");

router.get("/jogos", function (req, res, next) {
  res.send(jogosFutebol);
});

router.get("/jogo/:idJogo", function (req, res, next) {
  res.send(jogosFutebol.find((j) => j.id === req.params.idJogo));
});

router.get("/resultados/:idTime", function (req, res, next) {
  res.send(resultados.find((r) => r.id === req.params.idTime).resultados);
});

module.exports = router;

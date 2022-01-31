var express = require("express");
var router = express.Router();

var jogosFutebol = require("../geradores/futebol/jogosFut.json");

router.get("/jogos", function (req, res, next) {
  var jogos = [];
  jogos = jogos.concat(
    jogosFutebol.map((j) => ({
      id: j.id,
      campeonato: j.nome,
      casa: j.casa.nome,
      fora: j.fora.nome,
    }))
  );
  res.send(jogos);
});

router.get("/jogo/:idJogo", function (req, res, next) {
  res.send(jogosFutebol.find((j) => j.id === req.params.idJogo));
});

module.exports = router;

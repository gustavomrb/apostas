var express = require("express");
var router = express.Router();

var jogosFutebol = require("../geradores/futebol/jogosFut.json");
var times = require("../geradores/futebol/times.json");
var resultados = require("../geradores/futebol/resultados.json");

router.get("/jogos", function (req, res, next) {
  res.send(jogosFutebol);
});

router.get("/jogo/:idJogo", function (req, res, next) {
  res.send(jogosFutebol.find((j) => j.id === req.params.idJogo));
});

router.get("/resultados/:idTime", function (req, res, next) {
  let resultadosTime = resultados.find((r) => r.id === req.params.idTime).resultados;
  for (let param in req.query) {
    if (param === "tamanho") {
      resultadosTime = resultadosTime.filter((r) => {
        let time = times.find((t) => t.nome === r.oponente);
        time = time ? time.tamanho : "pequeno";
        return time === req.query.tamanho;
      });
    } else if (param === "data" && req.query.data) {
      resultadosTime = resultadosTime.filter((r) => req.query.data.includes(r.data.split(".")[2]));
    } else if (param === "resultado" && req.query.resultado) {
      resultadosTime = resultadosTime.filter((r) => req.query.resultado.includes(r.ft.resultado));
    } else if (param === "excluiOponente") {
      resultadosTime = resultadosTime.filter((r) => !req.query.excluiOponente.includes(r.oponente));
    } else if (req.query[param]) {
      resultadosTime = resultadosTime.filter((r) => req.query[param].includes(r[param]));
    }
  }
  res.send(resultadosTime);
});

module.exports = router;

import puppeteer from "puppeteer";
import fs from "fs";

const propIndexesAndNames = [
  {
    name: "pts",
    index: "3",
  },
  {
    name: "fg3m",
    index: "6",
  },
  {
    name: "reb",
    index: "7",
  },
  {
    name: "ast",
    index: "8",
  },
  {
    name: "stl",
    index: "9",
  },
  {
    name: "blk",
    index: "10",
  },
  {
    name: "ptsRebAst",
    composition: ["pts", "reb", "ast"],
  },
  {
    name: "ptsReb",
    composition: ["pts", "reb"],
  },
  {
    name: "ptsAst",
    composition: ["pts", "ast"],
  },
  {
    name: "rebAst",
    composition: ["reb", "ast"],
  },
  {
    name: "stlBlk",
    composition: ["stl", "blk"],
  },
];

const posicoes = ["PG", "SG", "SF", "PF", "C"];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const ranks = {
    pts: { PG: [], SG: [], SF: [], PF: [], C: [] },
    reb: { PG: [], SG: [], SF: [], PF: [], C: [] },
    ast: { PG: [], SG: [], SF: [], PF: [], C: [] },
    fg3m: { PG: [], SG: [], SF: [], PF: [], C: [] },
    stl: { PG: [], SG: [], SF: [], PF: [], C: [] },
    blk: { PG: [], SG: [], SF: [], PF: [], C: [] },
    ptsRebAst: { PG: [], SG: [], SF: [], PF: [], C: [] },
    ptsReb: { PG: [], SG: [], SF: [], PF: [], C: [] },
    ptsAst: { PG: [], SG: [], SF: [], PF: [], C: [] },
    rebAst: { PG: [], SG: [], SF: [], PF: [], C: [] },
    stlBlk: { PG: [], SG: [], SF: [], PF: [], C: [] },
  };

  await page.goto("https://hashtagbasketball.com/nba-defense-vs-position");
  await page.waitForSelector("#ContentPlaceHolder1_GridView1");

  let tableElem = await page.$("#ContentPlaceHolder1_GridView1");

  for (let i = 2; i <= 151; i++) {
    const rowElem = await tableElem.$(`tbody tr:nth-child(${i})`);
    const posicao = await rowElem.$eval("td:first-child", (n) => n.innerText);
    const time = await rowElem.$eval("td:nth-child(2) span:first-child", (n) => {
      const nomeCurtoTime = n.innerText;
      if (nomeCurtoTime === "SA") {
        return "SAS";
      } else if (nomeCurtoTime === "GS") {
        return "GSW";
      } else if (nomeCurtoTime === "NO") {
        return "NOP";
      } else if (nomeCurtoTime === "NY") {
        return "NYK";
      } else {
        return nomeCurtoTime;
      }
    });

    for (let prop of propIndexesAndNames) {
      if (prop.index) {
        const propValue = await rowElem.$eval(`td:nth-child(${prop.index}) span:first-child`, (n) =>
          parseFloat(n.innerText)
        );

        ranks[prop.name][posicao].push({ time: time, valor: propValue });
      } else {
        const value = prop.composition.reduce(
          (prev, curr) => parseFloat((prev + ranks[curr][posicao].find((r) => r.time === time).valor).toFixed(2)),
          0
        );
        ranks[prop.name][posicao].push({ time: time, valor: value });
      }
    }
  }

  for (let prop of propIndexesAndNames) {
    for (let pos of posicoes) {
      ranks[prop.name][pos].sort((a, b) => a.valor - b.valor);
      for (let i = 0; i < ranks[prop.name][pos].length; i++) {
        ranks[prop.name][pos][i].rank = i + 1;
      }
    }
  }

  fs.writeFile("./geradores/nba/defenseVsPosition.json", JSON.stringify(ranks, null, " "), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

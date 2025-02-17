var fs = require("fs");

const torneio = "lcs";
const split = "223";
const teamsStats = JSON.parse(fs.readFileSync(`./geradores/lol/${torneio}/teamsStats.json`));

(async () => {
  let jogos = [
    { time1: "Immortals", time2: "Golden Guardians" },
    { time1: "FlyQuest", time2: "Evil Geniuses" },
    { time1: "Cloud9", time2: "100 Thieves" },
    { time1: "TSM", time2: "Team Liquid" },
    { time1: "NRG", time2: "Dignitas" },
  ];
  const gameLines = [];
  for (let jogo of jogos) {
    const line = geraLinhaJogo(teamsStats[jogo.time1], teamsStats[jogo.time2]);
    if (line) gameLines.push(line);
  }

  fs.writeFileSync(`./geradores/lol/${torneio}/gameLinesPreview.json`, JSON.stringify(gameLines, null, "  "), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
})();

function geraLinhaJogo(blueSideStats, redSideStats) {
  const teamsStats = [blueSideStats.filter((s) => s.split === split), redSideStats.filter((s) => s.split === split)];
  const lines = [];

  for (let teamStats of teamsStats) {
    const numGames = teamStats.length;

    let wTotal = 0,
      goldTotal = 0,
      killsTotal = 0,
      deathsTotal = 0,
      towersTotal = 0,
      oppTowersTotal = 0,
      fbTotal = 0,
      ftTotal = 0,
      gameDurationTotal = 0,
      oppGoldTotal = 0,
      wTotalL3 = 0,
      goldTotalL3 = 0,
      killsTotalL3 = 0,
      deathsTotalL3 = 0,
      towersTotalL3 = 0,
      oppTowersTotalL3 = 0,
      fbTotalL3 = 0,
      ftTotalL3 = 0,
      gameDurationTotalL3 = 0,
      oppGoldTotalL3 = 0,
      gamesL3 = 0;

    for (let i = 0; i < numGames; i++) {
      wTotal += teamStats[i].wl;
      goldTotal += teamStats[i].gold;
      killsTotal += teamStats[i].kills;
      deathsTotal += teamStats[i].deaths;
      towersTotal += teamStats[i].towers;
      oppTowersTotal += teamStats[i].oppTowers;
      fbTotal += teamStats[i].firstBlood;
      ftTotal += teamStats[i].firstTower;
      gameDurationTotal += teamStats[i].gameDuration;
      oppGoldTotal += teamStats[i].oppGold;

      if (i >= numGames - 3) {
        gamesL3 += 1;
        wTotalL3 += teamStats[i].wl;
        goldTotalL3 += teamStats[i].gold;
        killsTotalL3 += teamStats[i].kills;
        deathsTotalL3 += teamStats[i].deaths;
        towersTotalL3 += teamStats[i].towers;
        oppTowersTotalL3 += teamStats[i].oppTowers;
        fbTotalL3 += teamStats[i].firstBlood;
        ftTotalL3 += teamStats[i].firstTower;
        gameDurationTotalL3 += teamStats[i].gameDuration;
        oppGoldTotalL3 += teamStats[i].oppGold;
      }
    }

    let winRate = Number((wTotal / numGames).toFixed(2));
    let kdr = Number((killsTotal / deathsTotal).toFixed(2));
    let gpm = Number((goldTotal / gameDurationTotal).toFixed(2));
    let oppgpm = Number((oppGoldTotal / gameDurationTotal).toFixed(2));
    let gdpm = Number((gpm - oppgpm).toFixed(2));
    let avgGameDuration = Number((gameDurationTotal / numGames).toFixed(2));
    let kpg = Number((killsTotal / numGames).toFixed(2));
    let dpg = Number((deathsTotal / numGames).toFixed(2));
    let tkpg = Number((towersTotal / numGames).toFixed(2));
    let tlpg = Number((oppTowersTotal / numGames).toFixed(2));
    let fbr = Number((fbTotal / numGames).toFixed(2));
    let ftr = Number((ftTotal / numGames).toFixed(2));

    let winRateL3 = Number((wTotalL3 / gamesL3).toFixed(2));
    let kdrL3 = Number((deathsTotalL3 !== 0 ? killsTotalL3 / deathsTotalL3 : killsTotalL3).toFixed(2));
    let gpmL3 = Number((goldTotalL3 / gameDurationTotalL3).toFixed(2));
    let oppgpmL3 = Number((oppGoldTotalL3 / gameDurationTotalL3).toFixed(2));
    let gdpmL3 = Number((gpmL3 - oppgpmL3).toFixed(2));
    let avgGameDurationL3 = Number((gameDurationTotalL3 / 3).toFixed(2));
    let kpgL3 = Number((killsTotalL3 / gamesL3).toFixed(2));
    let dpgL3 = Number((deathsTotalL3 / gamesL3).toFixed(2));
    let tkpgL3 = Number((towersTotalL3 / gamesL3).toFixed(2));
    let tlpgL3 = Number((oppTowersTotalL3 / gamesL3).toFixed(2));
    let fbrL3 = Number((fbTotalL3 / gamesL3).toFixed(2));
    let ftrL3 = Number((ftTotalL3 / gamesL3).toFixed(2));

    lines.push({
      winRate,
      kdr,
      gpm,
      oppgpm,
      gdpm,
      avgGameDuration,
      kpg,
      dpg,
      tkpg,
      tlpg,
      fbr,
      ftr,
      winRateL3,
      kdrL3,
      gpmL3,
      oppgpmL3,
      gdpmL3,
      avgGameDurationL3,
      kpgL3,
      dpgL3,
      tkpgL3,
      tlpgL3,
      fbrL3,
      ftrL3,
    });
  }

  return {
    teamAWR: lines[0].winRate,
    teamAKDR: lines[0].kdr,
    teamAGPM: lines[0].gpm,
    teamAOppGPM: lines[0].oppgpm,
    teamAGDPM: lines[0].gdpm,
    teamAAGD: lines[0].avgGameDuration,
    teamAKPG: lines[0].kpg,
    teamADPG: lines[0].dpg,
    teamATKPG: lines[0].tkpg,
    teamATLPG: lines[0].tlpg,
    teamAFBR: lines[0].fbr,
    teamAFTR: lines[0].ftr,
    teamAWRL3: lines[0].winRateL3,
    teamAKDRL3: lines[0].kdrL3,
    teamAGPML3: lines[0].gpmL3,
    teamAOppGPML3: lines[0].oppgpmL3,
    teamAGDPML3: lines[0].gdpmL3,
    teamAAGDL3: lines[0].avgGameDurationL3,
    teamAKPGL3: lines[0].kpgL3,
    teamADPGL3: lines[0].dpgL3,
    teamATKPGL3: lines[0].tkpgL3,
    teamATLPGL3: lines[0].tlpgL3,
    teamAFBRL3: lines[0].fbrL3,
    teamAFTRL3: lines[0].ftrL3,
    teamBWR: lines[1].winRate,
    teamBKDR: lines[1].kdr,
    teamBGPM: lines[1].gpm,
    teamBOppGPM: lines[1].oppgpm,
    teamBGDPM: lines[1].gdpm,
    teamBAGD: lines[1].avgGameDuration,
    teamBKPG: lines[1].kpg,
    teamBDPG: lines[1].dpg,
    teamBTKPG: lines[1].tkpg,
    teamBTLPG: lines[1].tlpg,
    teamBFBR: lines[1].fbr,
    teamBFTR: lines[1].ftr,
    teamBWRL3: lines[1].winRateL3,
    teamBKDRL3: lines[1].kdrL3,
    teamBGPML3: lines[1].gpmL3,
    teamBOppGPML3: lines[1].oppgpmL3,
    teamBGDPML3: lines[1].gdpmL3,
    teamBAGDL3: lines[1].avgGameDurationL3,
    teamBKPGL3: lines[1].kpgL3,
    teamBDPGL3: lines[1].dpgL3,
    teamBTKPGL3: lines[1].tkpgL3,
    teamBTLPGL3: lines[1].tlpgL3,
    teamBFBRL3: lines[1].fbrL3,
    teamBFTRL3: lines[1].ftrL3,
  };
}

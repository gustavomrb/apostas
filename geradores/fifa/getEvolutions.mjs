import puppeteer from "puppeteer-extra";
import fs from "fs";

import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const jogadores = JSON.parse(fs.readFileSync("./geradores/fifa/evolutions.json"));

(async () => {
  const browser = await puppeteer.launch({
    targetFilter: (target) => !!target.url(),
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto("https://www.futbin.com/players/evolutions?page=09&pos_type=all");
  await page.waitForSelector("#repTb");

  let allPlayersLinks = await page.$$eval("#repTb tbody tr[class^='player_tr']", (n) =>
    n.map((e) => e.getAttribute("data-url"))
  );

  for (let i = 0; i < allPlayersLinks.length; i++) {
    //for (let playerLink of allPlayersLinks) {
    await page.goto("https://www.futbin.com" + allPlayersLinks[i]);
    await page.waitForSelector("#evo-path-row");

    const nomeJogador = await page.$eval(".table-info tbody tr td", (n) => n.innerText);
    const baseStats = await page.$eval("#total_bs_gauge text:nth-child(even) tspan", (n) => parseInt(n.innerHTML));
    const igs = await page.$eval("#total_igs_gauge text:nth-child(even) tspan", (n) => parseInt(n.innerHTML));
    const skills = await page.$eval(".table-info tr:nth-child(6) td", (n) => n.innerText);
    const wf = await page.$eval(".table-info tr:nth-child(7) td", (n) => n.innerText);
    let evolutions = await page.$$eval("#evo-path-row .fb-slider-col .title-inner", (nodes) =>
      nodes.map((e) => e.innerText)
    );

    let evolucaoNaoDisponivel = false;

    for (let evolution of evolutions) {
      if (
        evolution.includes("Centurions") ||
        evolution === "Relentless Winger" ||
        evolution === "Welcome to Evolutions" ||
        evolution === "" ||
        evolution.includes("Pacey Winger") ||
        evolution.includes("Radioactive") ||
        evolution.includes("Trequartista")
      )
        evolucaoNaoDisponivel = true;
    }

    if (evolucaoNaoDisponivel) continue;

    const jogador = {
      nome: nomeJogador,
      link: allPlayersLinks[i],
      ratings: [],
      evolutions: evolutions,
      baseStats: baseStats,
      igs: igs,
      skills: `skill: ${skills} wf: ${wf}`,
    };

    const chemDivs = await page.$$(".chem_style_dd .pick_style");
    for (let chemDiv of chemDivs) {
      const chemName = await chemDiv.evaluate((n) => n.getAttribute("data-tname"));
      await chemDiv.click();
      const posicoes = await page.$$eval(".rpp_position", (nodes) => nodes.map((e) => e.innerText));
      const ratings = await page.$$eval(".rpp_rating", (nodes) => nodes.map((e) => parseInt(e.innerText)));

      for (let j = 0; j < ratings.length; j++) {
        if (ratings[j] >= 94) {
          jogador.ratings.push(`${chemName} ${posicoes[j]} ${ratings[j]}`);
        }
      }
    }

    if (jogador.ratings.length > 0 && !jogadores.find((j) => j.link === jogador.link)) {
      console.log(jogador.nome);
      jogadores.push(jogador);
    }
  }

  jogadores.sort((a, b) => b.igs - a.igs);

  fs.writeFile("./geradores/fifa/evolutions.json", JSON.stringify(jogadores, null, " "), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  await browser.close();
})();

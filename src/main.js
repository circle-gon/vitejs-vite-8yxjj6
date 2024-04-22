import { createApp, watchEffect } from "vue";
import { loadStorage, player, startAutoSave, save } from "./core/save";
import { TPS } from "./core/utils";
import { massGain } from "./main/mass";
import App from "./App.vue";
import "./style.css";
import { buildingAuto } from "./main/buildings";
import { hasUpgrade, upgradeAuto } from "./main/upgrades";
import { rankAuto } from "./main/ranks";
import { bhGain, darkMatterGain } from "./main/dm";
import { ragePowerGain } from "./main/rage";
import { PARTICLES, atomicPowerGain, powerGain } from "./atom/atom";

function loop() {
  const now = Date.now();
  const diff = (now - player.lastUpdate) / 1000;
  player.lastUpdate = now;
  TPS.value = 1 / diff;

  if (!player.options.paused) {
    player.time += diff;
    player.mass = massGain.value.mul(diff).add(player.mass);
    if (player.dm.unlocked)
      player.dm.mass = bhGain.value.mul(diff).add(player.dm.mass);
    if (hasUpgrade("dm", 5))
      player.rage.power = ragePowerGain.value.mul(diff).add(player.rage.power);
    if (player.ranks[0].gte(175)) player.challenge.unlocked = true;
    if (player.atom.unlocked) {
      for (let i = 0; i < PARTICLES.length; i++)
        player.atom.powers[i] = powerGain(i)
          .mul(diff)
          .add(player.atom.powers[i]);
      player.atom.power = atomicPowerGain.value
        .mul(diff)
        .add(player.atom.power);
    }
    if (hasUpgrade("atom", 5)) player.dm.darkMatter = darkMatterGain.value.mul(diff).add(player.dm.darkMatter)
  }

  upgradeAuto();
  rankAuto();
  buildingAuto();
  requestAnimationFrame(loop);
}

function updateCss() {
  watchEffect(() => {
    const { style } = document.documentElement;
    style.setProperty("--font", player.options.font);
  });
}

function init() {
  createApp(App).mount("body");
  loadStorage();
  startAutoSave();
  updateCss();
  loop();
}

function debug() {
  return new Promise((resolve) => {
    // ERUDA
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      window.eruda.init();
      resolve();
    };
    document.body.append(script);

    // debug helps
    window.player = player;
    window.addEventListener("keypress", (e) => {
      if (e.key === "p") {
        player.options.paused = !player.options.paused;
        save();
      }
    });
  });
}

if (import.meta.env.DEV) debug().then(() => init());
else init();

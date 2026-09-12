/**
 * Наборы картинок: что ведущий заготовил заранее.
 *
 * Загадка на порядок живёт не выдумкой на ходу, а подготовкой: шесть фресок
 * в порядке событий, четыре герба по старшинству, пять ступеней обряда.
 * Собрать такое посреди сцены нельзя — значит, склад должен быть заведён
 * до игры и лежать в мире, а не в браузере: у каждой вселенной свой.
 *
 * Порядок строк в наборе и есть правильный порядок. Тасует их сама загадка
 * при выкладывании, а здесь ведущий видит картинки так, как они должны
 * встать в конце.
 */

import { MODULE_ID } from "./stol.mjs";
import { Т } from "./yazyk.mjs";

const { DialogV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/** [{имя, картинки: [{путь, подпись}]}] */
export const пул = () => {
  const список = game.settings.get(MODULE_ID, "nabory");
  return Array.isArray(список) ? список : [];
};

export async function сохранить(список) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, "nabory", список);
}

/**
 * Пункт в настройках модуля: Foundry делает `new Тип()` и зовёт render,
 * а своего окна у склада нет — правку ведёт обычный диалог.
 */
export class МенюНаборов extends foundry.applications.api.ApplicationV2 {
  async render() {
    await редактор();
    return this;
  }
}

/* ─────────────────────────── список наборов ─────────────────────────── */

export async function редактор() {
  if (!game.user.isGM) return;

  const наборы = пул();
  const строки = наборы.length
    ? `<div class="uo-zagotovki">${наборы.map((н, i) => `
        <div class="uo-zagotovka">
          <span>${экранировать(н.имя)} <span class="uo-podskazka">${Т(`— картинок: {картинки}`, { картинки: н.картинки?.length ?? 0 })}</span></span>
          <button type="button" class="uo-pravit" data-i="${i}">${Т("Править")}</button>
          <button type="button" class="uo-zabyt" data-i="${i}">${Т("Забыть")}</button>
        </div>`).join("")}</div>`
    : `<p class="uo-podskazka">${Т("Наборов пока нет.")}</p>`;

  await DialogV2.wait({
    window: { title: Т("Наборы картинок"), icon: "fa-solid fa-images" },
    position: { width: 470 },
    content: `
      <div class="uo-forma">
        <p class="uo-podskazka">${Т("Что игроки будут расставлять по порядку. Порядок строк в наборе — и есть правильный: тасует их загадка сама, когда вы её выкладываете.")}</p>
        ${строки}
      </div>`,
    buttons: [
      { action: "новый", label: Т("Создать набор"), default: true, callback: () => правкаНабора(-1) },
      { action: "закрыть", label: Т("Закрыть") },
    ],
    render: (event, диалог) => {
      const корень = диалог.element;
      корень.querySelectorAll(".uo-pravit").forEach(к =>
        к.addEventListener("click", () => { диалог.close(); правкаНабора(Number(к.dataset.i)); }));
      корень.querySelectorAll(".uo-zabyt").forEach(к =>
        к.addEventListener("click", async () => {
          const все = пул().filter((_, i) => i !== Number(к.dataset.i));
          await сохранить(все);
          диалог.close();
          редактор();
        }));
    },
  });
}

/* ─────────────────────────── правка одного ─────────────────────────── */

async function правкаНабора(индекс) {
  if (!game.user.isGM) return;

  const наборы = пул();
  const набор = индекс >= 0 ? наборы[индекс] : { имя: "", картинки: [] };
  if (!набор) return;

  const строка = (к = { путь: "", подпись: "" }) => `
    <div class="uo-kartinka-stroka">
      <button type="button" class="uo-vverh" title="${Т("выше")}">▲</button>
      <button type="button" class="uo-vniz" title="${Т("ниже")}">▼</button>
      <input type="text" class="uo-put" value="${экранировать(к.путь)}" placeholder="${Т("путь к картинке")}">
      <button type="button" class="uo-vybrat" title="${Т("выбрать файл")}">…</button>
      <input type="text" class="uo-podpis" value="${экранировать(к.подпись)}" placeholder="${Т("подпись")}">
      <button type="button" class="uo-ubrat-stroku" title="${Т("убрать")}">✕</button>
    </div>`;

  const было = набор.картинки?.length ? набор.картинки : [{ путь: "", подпись: "" }];

  await DialogV2.wait({
    window: { title: индекс >= 0 ? `Набор «${набор.имя}»` : Т("Новый набор"), icon: "fa-solid fa-images" },
    position: { width: 620 },
    content: `
      <div class="uo-forma">
        <label>${Т("Название набора")} <input type="text" name="имя" value="${экранировать(набор.имя)}"></label>
        <p class="uo-podskazka">${Т("Сверху вниз — правильный порядок. Подпись видна игрокам под картинкой; оставьте пустой, если подсказывать нечем.")}</p>
        <div class="uo-kartinki">${было.map(строка).join("")}</div>
        <button type="button" class="uo-dobavit-stroku">${Т("Добавить картинку")}</button>
      </div>`,
    buttons: [
      {
        action: "сохранить", label: Т("Сохранить"), default: true,
        callback: async (event, кнопка, диалог) => {
          const э = диалог.element;
          const имя = э.querySelector(`[name="имя"]`).value.trim();
          if (!имя) return void ui.notifications.warn(Т("У набора должно быть название"));

          const картинки = [...э.querySelectorAll(".uo-kartinka-stroka")]
            .map(с => ({
              путь: с.querySelector(".uo-put").value.trim(),
              подпись: с.querySelector(".uo-podpis").value.trim(),
            }))
            .filter(к => к.путь);

          if (картинки.length < 2) return void ui.notifications.warn(Т("В наборе должно быть хотя бы две картинки"));

          const все = пул();
          if (индекс >= 0) все[индекс] = { имя, картинки };
          else все.push({ имя, картинки });
          await сохранить(все);
          ui.notifications.info(`Набор «${имя}»: картинок ${картинки.length}`);
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => {
      const корень = диалог.element;
      const гнездо = корень.querySelector(".uo-kartinki");

      const повесить = с => {
        с.querySelector(".uo-ubrat-stroku").addEventListener("click", () => с.remove());
        с.querySelector(".uo-vverh").addEventListener("click", () => {
          const выше = с.previousElementSibling;
          if (выше) гнездо.insertBefore(с, выше);
        });
        с.querySelector(".uo-vniz").addEventListener("click", () => {
          const ниже = с.nextElementSibling;
          if (ниже) гнездо.insertBefore(ниже, с);
        });
        с.querySelector(".uo-vybrat").addEventListener("click", async () => {
          const поле = с.querySelector(".uo-put");
          const выбор = new foundry.applications.apps.FilePicker.implementation({
            type: "image",
            current: поле.value,
            callback: путь => { поле.value = путь; },
          });
          await выбор.browse();
        });
      };

      гнездо.querySelectorAll(".uo-kartinka-stroka").forEach(повесить);
      корень.querySelector(".uo-dobavit-stroku").addEventListener("click", () => {
        const болванка = document.createElement("div");
        болванка.innerHTML = строка();
        const новая = болванка.firstElementChild;
        гнездо.appendChild(новая);
        повесить(новая);
        новая.querySelector(".uo-put").focus();
      });
    },
  });
}

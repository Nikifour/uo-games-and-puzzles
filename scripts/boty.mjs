/**
 * Пул соперников: кого ведущий сажает за стол.
 *
 * Готовые характеры («осторожный трактирщик», «безрассудный наёмник») —
 * это про то, как бот играет. А за столом сидит не характер, а человек:
 * Старый Мартин, староста Тобиас, кузнец Бьорн. Поэтому имя задаёт ведущий,
 * и раз заданное живёт в мире, а не набирается заново каждую партию.
 *
 * Пул хранится в настройке мира: у каждой вселенной свой набор лиц, и второму
 * ведущему того же мира они достанутся вместе с ним.
 */

import { MODULE_ID } from "./stol.mjs";
import { ХАРАКТЕРЫ, ХАРАКТЕР_ПО_УМОЛЧАНИЮ } from "./kosti-bot.mjs";
import { Т } from "./yazyk.mjs";

const { DialogV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/** [{имя, характер}] */
export const пул = () => {
  const список = game.settings.get(MODULE_ID, "boty");
  return Array.isArray(список) ? список : [];
};

export async function сохранить(список) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, "boty", список);
}

/** Разметка выбора характера. */
export const выборХарактера = (выбранный = ХАРАКТЕР_ПО_УМОЛЧАНИЮ) => Object.entries(ХАРАКТЕРЫ)
  .map(([id, х]) => `<option value="${id}" ${id === выбранный ? "selected" : ""}>${экранировать(Т(х.имя))}</option>`)
  .join("");

/** Как зовут характер — для подписи в списках. */
export const подписьХарактера = ключ => ХАРАКТЕРЫ[ключ] ? Т(ХАРАКТЕРЫ[ключ].имя) : Т("неизвестный нрав");

/**
 * Пункт в настройках модуля.
 *
 * Foundry требует, чтобы за пунктом настроек стояло приложение: она делает
 * `new Тип()` и зовёт `render`. Своего окна у пула нет — правку ведёт обычный
 * диалог, поэтому render просто открывает его. Список соперников — вещь
 * редкая и настроечная, ему не место в панели, из которой начинают игру.
 */
export class МенюСоперников extends foundry.applications.api.ApplicationV2 {
  async render() {
    await редактор();
    return this;
  }
}

/**
 * Правка пула.
 *
 * Нарочно простая таблица: имя, нрав, крестик. Ведущему нужно вписать
 * десяток трактирных завсегдатаев за один присест, а не заполнять карточку
 * на каждого.
 */
export async function редактор() {
  if (!game.user.isGM) return;

  const строка = (б = { имя: "", характер: ХАРАКТЕР_ПО_УМОЛЧАНИЮ }) => `
    <div class="uo-bot-stroka">
      <input type="text" class="uo-bot-imya" value="${экранировать(б.имя)}" placeholder="${Т("имя за столом")}">
      <select class="uo-bot-nrav">${выборХарактера(б.характер)}</select>
      <button type="button" class="uo-bot-ubrat" title="${Т("убрать из пула")}">✕</button>
    </div>`;

  const текущие = пул();
  const содержимое = `
    <div class="uo-forma">
      <p class="uo-podskazka">${Т("Кого ведущий может посадить за стол. Имя видят игроки — пишите так, как зовут этого человека в вашем мире.")}</p>
      <div class="uo-boty">${(текущие.length ? текущие : [{ имя: "", характер: ХАРАКТЕР_ПО_УМОЛЧАНИЮ }]).map(строка).join("")}</div>
      <button type="button" class="uo-bot-dobavit">${Т("Добавить")}</button>
    </div>`;

  await DialogV2.wait({
    window: { title: Т("Соперники за столом"), icon: "fa-solid fa-users" },
    position: { width: 470 },
    content: содержимое,
    buttons: [
      {
        action: "сохранить", label: Т("Сохранить"), default: true,
        callback: async (event, кнопка, диалог) => {
          const строки = [...диалог.element.querySelectorAll(".uo-bot-stroka")];
          const список = строки
            .map(с => ({
              имя: с.querySelector(".uo-bot-imya").value.trim(),
              характер: с.querySelector(".uo-bot-nrav").value,
            }))
            .filter(б => б.имя);                     // безымянных в пуле не держим
          await сохранить(список);
          ui.notifications.info(Т(`Соперников в пуле: {сколько}`, { сколько: список.length }));
          return список;
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => {
      const корень = диалог.element;
      const гнездо = корень.querySelector(".uo-boty");

      const повесить = строка => строка.querySelector(".uo-bot-ubrat")
        .addEventListener("click", () => строка.remove());
      гнездо.querySelectorAll(".uo-bot-stroka").forEach(повесить);

      корень.querySelector(".uo-bot-dobavit").addEventListener("click", () => {
        const болванка = document.createElement("div");
        болванка.innerHTML = строка();
        const новая = болванка.firstElementChild;
        гнездо.appendChild(новая);
        повесить(новая);
        новая.querySelector(".uo-bot-imya").focus();
      });
    },
  });
}

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
import { ХАРАКТЕРЫ, ХАРАКТЕР_ПО_УМОЛЧАНИЮ, ВСТРОЕННЫЕ, СВОЙ, РУЧКИ, нравИзЗаписи, нравСловами } from "./kosti-bot.mjs";
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

/* ─────────────────────────────── нравы ─────────────────────────────── */
/*
 * Конструктор нравов. Встроенных четыре, и они не правятся — у них в списках
 * и справке своё имя. Свои ведущий собирает из тех же ручек и хранит в мире:
 * они сразу встают во все списки, где выбирают нрав, — в пул, в посадку,
 * к безымянным ботам и к жетонам.
 */

/** Свои нравы из настройки мира: [{id, имя, жадность, мастерство, ловкость, внимание}]. */
export const своиНравы = () => {
  const список = game.settings.get(MODULE_ID, "nravy");
  return Array.isArray(список) ? список : [];
};

/**
 * Пул после правки нравов: у кого нрав пропал — тот снова осторожный
 * трактирщик, а не «неизвестный нрав» в списке.
 *
 * @param {{имя:string, характер:string}[]} пул
 * @param {Set<string>} свои   — ключи своих нравов, что остались
 */
export function пулБезПропавших(пул, свои) {
  let сменено = 0;
  const новый = пул.map(б => {
    if (б.характер in ВСТРОЕННЫЕ || свои.has(б.характер)) return б;
    сменено++;
    return { ...б, характер: ХАРАКТЕР_ПО_УМОЛЧАНИЮ };
  });
  return { пул: новый, сменено };
}

/** Нрав словами для подписи: «рискует · порой ошибается». */
const словами = х => нравСловами(х).map(с => Т(с)).join(" · ");

/** Как показывать значение ручки: жадность числом, мастерство долей. */
const показать = (ручка, значение) => (ручка === "мастерство"
  ? `${Math.round(значение * 100)}%`
  : ручка === "жадность" ? Number(значение).toFixed(1) : String(значение));

/** Карточка своего нрава: название, четыре ручки и он же словами. */
function карточкаНрава(запись) {
  const х = нравИзЗаписи(запись);
  const ползунок = (ручка, подпись) => {
    const р = РУЧКИ[ручка];
    // Мастерство на ползунке в процентах: «80» понятнее, чем «0.8»
    const доля = ручка === "мастерство" ? 100 : 1;
    return `
      <label class="uo-nrav-ruchka"><span class="uo-nrav-podpis">${подпись}</span>
        <input type="range" data-ruchka="${ручка}" min="${р.от * доля}" max="${р.до * доля}" step="${р.шаг * доля}" value="${х[ручка] * доля}">
        <output>${показать(ручка, х[ручка])}</output>
      </label>`;
  };
  const число = (ручка, подпись) => {
    const р = РУЧКИ[ручка];
    return `
      <label class="uo-nrav-ruchka">${подпись}
        <input type="number" data-ruchka="${ручка}" min="${р.от}" max="${р.до}" step="${р.шаг}" value="${х[ручка]}">
      </label>`;
  };
  return `
    <div class="uo-nrav" data-id="${экранировать(запись.id)}">
      <div class="uo-nrav-shapka">
        <input type="text" class="uo-nrav-imya" value="${экранировать(запись.имя ?? "")}" placeholder="${Т("Название нрава — его видят как имя безымянного бота")}">
        <button type="button" class="uo-nrav-ubrat" title="${Т("убрать нрав")}">✕</button>
      </div>
      ${ползунок("жадность", Т("Жадность"))}
      ${ползунок("мастерство", Т("Мастерство"))}
      <div class="uo-nrav-ryad">
        ${число("ловкость", Т("Ловкость рук"))}
        ${число("внимание", Т("Внимание"))}
      </div>
      <p class="uo-podskazka uo-nrav-slovami">${словами(х)}</p>
    </div>`;
}

/** Нрав, собранный из карточки. Пустое название — «Свой нрав N». */
function нравИзКарточки(карточка, номер) {
  const ручка = имя => карточка.querySelector(`[data-ruchka="${имя}"]`)?.value;
  return {
    id: карточка.dataset.id,
    ...нравИзЗаписи({
      жадность: ручка("жадность"),
      мастерство: Number(ручка("мастерство")) / 100,
      ловкость: ручка("ловкость"),
      внимание: ручка("внимание"),
    }),
    имя: карточка.querySelector(".uo-nrav-imya").value.trim() || Т("Свой нрав {номер}", { номер }),
  };
}

/** Пункт «Нравы ботов» в настройках модуля: как и у пула, своё окно — обычный диалог. */
export class МенюНравов extends foundry.applications.api.ApplicationV2 {
  async render() {
    await редакторНравов();
    return this;
  }
}

/** Конструктор нравов. */
export async function редакторНравов() {
  if (!game.user.isGM) return;

  const встроенные = Object.entries(ВСТРОЕННЫЕ).map(([ключ, х]) => `
    <div class="uo-nrav-vstroennyj">
      <span><strong>${экранировать(Т(х.имя))}</strong> <span class="uo-podskazka">— ${словами(х)}</span></span>
      <button type="button" class="uo-nrav-osnova" data-osnova="${ключ}">${Т("Взять за основу")}</button>
    </div>`).join("");

  const содержимое = `
    <div class="uo-forma uo-nravy">
      <p class="uo-podskazka">${Т("Нрав — то, как бот играет. Свои нравы встают во все списки рядом со встроенными: в пул соперников, в посадку, к безымянным ботам и жетонам.")}</p>
      <ul class="uo-podskazka uo-nravy-ruchki">
        <li>${Т("<strong>Жадность</strong> — когда остановиться. 1 — ровно, меньше — бережётся и рано берёт своё, больше — тянет до последнего. Кости и Двадцать одно.")}</li>
        <li>${Т("<strong>Мастерство</strong> — как часто бот решает верно. Безупречный обыгрывает людей стабильно, и это скучно. Все три игры.")}</li>
        <li>${Т("<strong>Ловкость рук</strong> — бонус к проверке, когда бот играет краплёными костями.")}</li>
        <li>${Т("<strong>Внимание</strong> — пассивная внимательность: заметит ли бот, что сосед плутует.")}</li>
      </ul>
      <fieldset>
        <legend>${Т("Встроенные")}</legend>
        ${встроенные}
      </fieldset>
      <fieldset>
        <legend>${Т("Свои")}</legend>
        <div class="uo-nravy-svoi">${своиНравы().map(карточкаНрава).join("")}</div>
        <button type="button" class="uo-bot-dobavit uo-nrav-novyj"><i class="fa-solid fa-plus"></i> ${Т("Новый нрав")}</button>
      </fieldset>
    </div>`;

  await DialogV2.wait({
    window: { title: Т("Нравы ботов"), icon: "fa-solid fa-masks-theater" },
    position: { width: 540 },
    content: содержимое,
    buttons: [
      {
        action: "сохранить", label: Т("Сохранить"), default: true,
        callback: async (event, кнопка, диалог) => {
          const карточки = [...диалог.element.querySelectorAll(".uo-nrav")];
          const нравы = карточки.map((к, i) => нравИзКарточки(к, i + 1));
          await game.settings.set(MODULE_ID, "nravy", нравы);

          const { пул: новыйПул, сменено } = пулБезПропавших(пул(), new Set(нравы.map(н => н.id)));
          if (сменено) await сохранить(новыйПул);
          ui.notifications.info(Т("Своих нравов: {сколько}", { сколько: нравы.length }));
          if (сменено) ui.notifications.warn(Т("Соперников, чей нрав убран, — {сколько}: они снова осторожные трактирщики.", { сколько: сменено }));
          return нравы;
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => {
      const корень = диалог.element;
      const гнездо = корень.querySelector(".uo-nravy-svoi");

      const оживить = карточка => {
        карточка.querySelector(".uo-nrav-ubrat").addEventListener("click", () => карточка.remove());
        // Ползунок тянут — число и подпись словами идут за ним сразу
        карточка.addEventListener("input", () => {
          const н = нравИзКарточки(карточка, 0);
          for (const о of карточка.querySelectorAll("output")) {
            const ручка = о.previousElementSibling.dataset.ruchka;
            о.textContent = показать(ручка, н[ручка]);
          }
          карточка.querySelector(".uo-nrav-slovami").textContent = словами(н);
        });
      };
      const добавить = запись => {
        const болванка = document.createElement("div");
        болванка.innerHTML = карточкаНрава(запись);
        const карточка = болванка.firstElementChild;
        гнездо.append(карточка);
        оживить(карточка);
        карточка.querySelector(".uo-nrav-imya").focus();
      };
      гнездо.querySelectorAll(".uo-nrav").forEach(оживить);

      const новыйКлюч = () => СВОЙ + foundry.utils.randomID(8);
      корень.querySelector(".uo-nrav-novyj").addEventListener("click", () => добавить({
        id: новыйКлюч(), имя: "",
        ...Object.fromEntries(Object.entries(РУЧКИ).map(([к, р]) => [к, р.умолчание])),
      }));
      for (const кнопка of корень.querySelectorAll(".uo-nrav-osnova")) {
        кнопка.addEventListener("click", () => {
          const основа = ВСТРОЕННЫЕ[кнопка.dataset.osnova];
          добавить({ ...основа, id: новыйКлюч(), имя: Т("{имя}, свой вариант", { имя: Т(основа.имя) }) });
        });
      }
    },
  });
}

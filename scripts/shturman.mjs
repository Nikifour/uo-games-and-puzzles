/**
 * Устройства вида «видит один, делают другие».
 *
 * Внутри такого устройства — загадка из отдела «Загадки», разложенная на
 * двоих и больше: механизм видит один штурман, а детали двигают остальные
 * рычагами с пульта (vslepuju.mjs). Каждый механизм — своё устройство в
 * отделе «Устройства», с пометкой (У): «Зал призм (У)», «Кодовый замок (У)».
 * Следом сюда лягут лабиринт с шаром и прочие.
 *
 * Подготовка — одно окно: слева настройки, посередине сам механизм, справа
 * пульт. Механизм собирается заново, как только меняются его размеры, и
 * ведущий сразу видит, что выйдет. Там же он подписывает рычаги и помечает
 * детали номерами рычагов — штурман увидит номера только на помеченных.
 * Рычаги делятся на пульты, у пульта может быть свой игрок. Выкладывается
 * и запоминается ровно то, что на экране; заготовка открывается здесь же
 * («Править» на складе), и штурмана с пультами можно переставить под тех,
 * кто пришёл на сессию.
 *
 * Своего стола у устройства нет: на стол ложится сама загадка-механизм с
 * пометкой `вслепую`, её правила и окно и работают.
 */

import { ВИДЫ, ТЕМЫ, столПоId, записать } from "./stol.mjs";
import * as призмы from "./prizmy.mjs";
import * as замок from "./zamok.mjs";
import { перемешать, посадить, убратьПульт } from "./vslepuju.mjs";
import { собратьВручную } from "./prizmy-redaktor.mjs";
import { Т, М } from "./yazyk.mjs";
import { запомнить } from "./zagotovki.mjs";

const { ApplicationV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/** Таймер хранится в минутах (дробью), а вводится минутами и секундами. */
export const минСек = минут => {
  const всего = Math.round(Math.max(0, Number(минут) || 0) * 60);
  return { мин: Math.floor(всего / 60), сек: всего % 60 };
};
export const изМинСек = (мин, сек) => Math.max(0, Number(мин) || 0) + Math.max(0, Math.min(59, Number(сек) || 0)) / 60;

/** Поле таймера для окон выкладки: «X мин Y сек». */
export function полеТаймера(минут) {
  const { мин, сек } = минСек(минут);
  return `
    <label>${Т("Таймер")}
      <span class="uo-tajmer-pole">
        <input type="number" name="таймерМин" value="${мин}" min="0" step="1"> ${Т("мин")}
        <input type="number" name="таймерСек" value="${сек}" min="0" max="59" step="1"> ${Т("сек")}
      </span>
    </label>
    <p class="uo-podskazka">${Т("0 мин 0 сек — без таймера. Когда время выйдет, механизм заклинит; «Сбросить» заводит часы заново.")}</p>`;
}

/* ─────────────────────── замок как механизм ─────────────────────── */

const ДИСКОВ_ПО_УМОЛЧАНИЮ = 4;

/** Символы набора диска: из списка или свои (через пробел — словами). */
function символыДиска(н, id) {
  if (id === "svoi") {
    const строка = String(н.свои ?? "").trim();
    const свои = строка ? (строка.includes(" ") ? строка.split(/\s+/) : [...строка]) : [];
    return свои.length ? свои : замок.НАБОРЫ.cifry.символы;
  }
  return замок.НАБОРЫ[id]?.символы ?? замок.НАБОРЫ.cifry.символы;
}

const наугад = список => список[Math.floor(Math.random() * список.length)];

/**
 * Бросить кости по дискам: «код» — верные символы, «начало» — начальные,
 * «всё» — и то и другое. Начало целиком на коде не встаёт.
 */
function бросить(н, что) {
  const диски = н.диски.map(д => ({ ...д }));
  if (что !== "начало") диски.forEach(д => { д.верный = наугад(символыДиска(н, д.набор)); });
  if (что !== "код") {
    for (let попытка = 0; попытка < 20; попытка++) {
      диски.forEach(д => { д.начало = наугад(символыДиска(н, д.набор)); });
      if (!диски.every(д => д.начало === д.верный) || диски.every(д => символыДиска(н, д.набор).length < 2)) break;
    }
  }
  н.диски = диски;
}

const МЕХАНИЗМ_ЗАМКА = {
  имя: М("Кодовый замок"),
  устройство: М("Кодовый замок (У)"),
  иконка: "fa-solid fa-lock",
  тема: "kamen",
  класс: "uo-zamok-telo",
  умолчания: { предел: 0 },
  флаги: { обеСтороны: false },
  пересборка: ["обеСтороны"],
  начало: н => {
    if (!Array.isArray(н.диски) || !н.диски.length) {
      н.диски = Array.from({ length: ДИСКОВ_ПО_УМОЛЧАНИЮ }, () => ({ набор: "cifry", верный: "0", начало: "0" }));
      бросить(н, "всё");
    }
    н.свои ??= "";
  },
  поля: н => {
    const варианты = (символы, выбрано) => символы.map(с =>
      `<option value="${экранировать(с)}" ${с === выбрано ? "selected" : ""}>${экранировать(с)}</option>`).join("");
    const строки = н.диски.map((д, и) => {
      const символы = символыДиска(н, д.набор);
      return `
        <div class="uo-zamok-disk">
          <span class="uo-zamok-nomer">${и + 1}</span>
          <select data-u-disk="${и}" data-rol="набор" title="${Т("набор символов")}">${Object.entries(замок.НАБОРЫ).map(([id, набор]) =>
            `<option value="${id}" ${id === д.набор ? "selected" : ""}>${Т(набор.имя)}</option>`).join("")}
            <option value="svoi" ${д.набор === "svoi" ? "selected" : ""}>${Т("свои")}</option></select>
          <label>${Т("верный")} <select data-u-disk="${и}" data-rol="верный">${варианты(символы, д.верный)}</select></label>
          <label>${Т("в начале")} <select data-u-disk="${и}" data-rol="начало">${варианты(символы, д.начало)}</select></label>
        </div>`;
    }).join("");
    return `
      <label>${Т("Дисков")} <input type="number" name="дисков" value="${н.диски.length}" min="1" max="${замок.ДИСКОВ_НАИБОЛЬШЕ}" step="1"></label>
      <label>${Т("Свои символы")} <input type="text" name="свои" value="${экранировать(н.свои ?? "")}" placeholder="${Т("для дисков с набором «свои»: через пробел или подряд")}"></label>
      ${строки}
      <div class="uo-ustrojstvo-knopki">
        <button type="button" data-action="механизм" data-delo="код"><i class="fa-solid fa-dice"></i> ${Т("Случайный код")}</button>
        <button type="button" data-action="механизм" data-delo="начало"><i class="fa-solid fa-dice"></i> ${Т("Случайное начало")}</button>
        <button type="button" data-action="механизм" data-delo="всё"><i class="fa-solid fa-dice"></i> ${Т("Всё случайно")}</button>
      </div>
      <label>${Т("Рычаги в обе стороны")} <input type="checkbox" name="обеСтороны" ${н.обеСтороны ? "checked" : ""}></label>
      <p class="uo-podskazka">${Т("Выключено — у диска один рычаг, он проворачивает диск на шаг вперёд. Включено — два: вперёд и назад.")}</p>
      <label>${Т("Предел попыток")} <input type="number" name="предел" value="${н.предел}" min="0" step="1"></label>`;
  },
  /**
   * Диски из полей. Число дисков поменялось — рычагов стало иначе, механизм
   * собирается заново; прочее — только обновляется, рычаги остаются.
   */
  снять: (э, н) => {
    const сколько = Math.max(1, Math.min(замок.ДИСКОВ_НАИБОЛЬШЕ, Number(э.querySelector(`[name="дисков"]`)?.value) || н.диски.length));
    const было = JSON.stringify([н.диски, н.свои]);
    н.свои = э.querySelector(`[name="свои"]`)?.value?.trim() ?? н.свои;
    const поля = (и, роль) => э.querySelector(`[data-u-disk="${и}"][data-rol="${роль}"]`)?.value;
    const диски = н.диски.map((д, и) => ({ набор: поля(и, "набор") ?? д.набор, верный: поля(и, "верный") ?? д.верный, начало: поля(и, "начало") ?? д.начало }));
    // Набор диска сменился — прежний символ мог в нём не найтись: берём первый.
    for (const д of диски) {
      const символы = символыДиска(н, д.набор);
      if (!символы.includes(д.верный)) д.верный = символы[0];
      if (!символы.includes(д.начало)) д.начало = символы[0];
    }
    const менялоЧисло = сколько !== диски.length;
    while (диски.length < сколько) диски.push({ ...диски.at(-1) });
    н.диски = диски.slice(0, сколько);
    if (менялоЧисло) return "пересобрать";
    return JSON.stringify([н.диски, н.свои]) !== было ? "обновить" : null;
  },
  собрать: н => ({
    наборы: н.диски.map(д => символыДиска(н, д.набор)),
    код: н.диски.map(д => д.верный),
    начальные: н.диски.map(д => д.начало),
    обеСтороны: !!н.обеСтороны,
  }),
  детали: готовый => замок.деталиЗамка(готовый.код.length, готовый.обеСтороны),
  рисовать: (готовый, как) => `<div class="uo-diski">${готовый.код.map((_, и) => {
    const набор = готовый.наборы[и];
    const длина = набор.length;
    const поз = Math.max(0, набор.indexOf(готовый.начальные[и]));
    const детали = замок.деталиЗамка(1, готовый.обеСтороны).map(д => д.replace("д0", `д${и}`));
    const кнопка = д => {
      const н = как.номер(д);
      return `<button type="button" class="uo-krut uo-zamok-detal ${как.класс(д)}" data-action="${как.действие(д)}" data-kletka="${д}">${
        д.endsWith("-") ? "▲" : д.endsWith("+") ? "▼" : "⟳"}${н?.н ? `<span class="uo-nomer-rychaga${н.тускло ? " uo-tusklo" : ""}">${н.н}</span>` : ""}</button>`;
    };
    return `
      <div class="uo-disk">
        ${готовый.обеСтороны ? кнопка(детали[1]) : ""}
        <div class="uo-okoshko">
          <span class="uo-sosed">${экранировать(набор[(поз - 1 + длина) % длина])}</span>
          <span class="uo-simvol">${экранировать(набор[поз])}</span>
          <span class="uo-sosed">${экранировать(набор[(поз + 1) % длина])}</span>
        </div>
        ${кнопка(детали[0])}
      </div>`;
  }).join("")}</div>`,
  сводка: готовый => Т("Код: {код}. Так диски стоят в начале — штурман увидит их такими.", { код: готовый.код.join(" ") }),
  другой: н => бросить(н, "всё"),
  дело: (дело, н) => бросить(н, дело),
  выложить: конфиг => замок.выложить({
    ...конфиг,
    набор: конфиг.готовый.наборы[0], наборы: конфиг.готовый.наборы,
    код: конфиг.готовый.код, начальные: конфиг.готовый.начальные, обеСтороны: конфиг.готовый.обеСтороны,
  }),
};

/**
 * Механизмы: имя загадки, имя устройства в панели, свои поля и как его
 * собрать и нарисовать. `пересборка` — поля, от которых механизм строится
 * заново; прочие (предел) на постройку не влияют. Необязательное:
 * `снять(форма, н)` — свои поля, отвечает «пересобрать», «обновить» или
 * ничего; `дело(имя, н)` — свои кнопки; `другой(н)` — что делает «Другой»;
 * `вручную` — есть ли ручная сборка; `класс` — обёртка механизма.
 */
export const МЕХАНИЗМЫ = {
  prizmy: {
    имя: М("Зал призм"),
    устройство: М("Зал призм (У)"),
    иконка: "fa-solid fa-gem",
    тема: "bezdna",
    умолчания: { ширина: 7, высота: 7, ходов: 5, лишних: 1, предел: 0 },
    строки: { вид: "два", пара: "" },
    флаги: { вращается: true },
    пересборка: ["ширина", "высота", "ходов", "лишних", "пара", "вид", "вращается"],
    поля: н => `
      <label>${Т("Ширина")} <input type="number" name="ширина" value="${н.ширина}" min="5" max="12" step="1"></label>
      <label>${Т("Глубина")} <input type="number" name="высота" value="${н.высота}" min="5" max="12" step="1"></label>
      <label>${Т("Поворотов до решения")} <input type="number" name="ходов" value="${н.ходов}" min="3" max="${призмы.ХОДОВ_НАИБОЛЬШЕ}" step="1"></label>
      <label>${Т("Лишних зеркал")} <input type="number" name="лишних" value="${н.лишних}" min="0" max="${призмы.ЛИШНИХ_НАИБОЛЬШЕ}" step="1"></label>
      <label>${Т("Предел поворотов")} <input type="number" name="предел" value="${н.предел}" min="0" step="1"></label>
      <label>${Т("Вид зала")} <select name="вид">${призмы.выборВида(н.вид ?? "два")}</select></label>
      ${["два", "раз2", "разсл"].includes(н.вид ?? "два") ? `<label>${Т("Цвета лучей")} <select name="пара">${призмы.выборПары(н.пара ?? "")}</select></label>` : ""}
      ${String(н.вид ?? "").startsWith("раз") ? `<label>${Т("Разделитель вращается")} <input type="checkbox" name="вращается" ${н.вращается !== false ? "checked" : ""}></label>` : ""}`,
    собрать: н => призмы.собратьЗал(н),
    детали: готовый => призмы.деталиЗала(готовый),
    рисовать: (готовый, как) => призмы.рисоватьЗал(готовый, как),
    сводка: готовый => Т("Загадано на {глубина} поворот(ов) — столько нужно самое малое.", { глубина: готовый.глубина }),
    вручную: true,
    выложить: конфиг => призмы.выложить(конфиг),
  },
  zamok: МЕХАНИЗМ_ЗАМКА,
};

export async function выложить(конфиг = {}) {
  if (!game.user.isGM) return null;
  const механизм = МЕХАНИЗМЫ[конфиг.механизм] ?? МЕХАНИЗМЫ.prizmy;
  if (!конфиг.штурман) { ui.notifications.error(Т("Выберите штурмана.")); return null; }

  // Пульт не отдают штурману, а бесхозный пульт кто-то, кроме штурмана, должен взять.
  const пульты = Array.isArray(конфиг.пульты) && конфиг.пульты.length ? конфиг.пульты : [""];
  const игроки = game.users.filter(u => !u.isGM).map(u => u.id);
  const номерШтурмана = пульты.findIndex(кто => кто && кто === конфиг.штурман);
  if (номерШтурмана >= 0) {
    ui.notifications.error(Т("Пульт {номер} отдан штурману — отдайте его другому игроку.", { номер: номерШтурмана + 1 }));
    return null;
  }
  if (пульты.some(кто => !кто) && !игроки.some(id => id !== конфиг.штурман)) {
    ui.notifications.error(Т("У пульта никого, кроме штурмана: рычаги тянуть некому."));
    return null;
  }

  return механизм.выложить({ ...конфиг, вслепую: true });
}

/* ─────────────────────────── окно подготовки ─────────────────────────── */

export class ОкноПодготовкиУ extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    const з = options.заготовка ?? {};
    this.ключ = МЕХАНИЗМЫ[options.ключ] ? options.ключ : "prizmy";
    const м = МЕХАНИЗМЫ[this.ключ];
    const игроки = game.users.filter(u => !u.isGM);

    this.н = {
      ...м.умолчания, ...(м.строки ?? {}), ...(м.флаги ?? {}),
      название: Т(м.имя), подпись: "", штурман: игроки[0]?.id ?? "", подсказкаШтурману: "",
      таймер: 0, тема: м.тема, макрос: "", крутят: [],
      ...Object.fromEntries(Object.entries(з).filter(([к]) => !["готовый", "рычаги", "пометки", "механизм"].includes(к))),
      заготовка: options.имяЗаготовки ?? "",
    };
    this.н.крутят = [];            // к рычагам допускают пульты, а не общий список
    м.начало?.(this.н);
    // Хозяева пультов из заготовки: кого нет в мире — пульт становится бесхозным.
    const есть = new Set(игроки.map(u => u.id));
    this.пульты = (Array.isArray(з.пульты) && з.пульты.length ? з.пульты : [""]).map(кто => (есть.has(кто) ? кто : ""));
    if (!есть.has(this.н.штурман)) this.н.штурман = игроки[0]?.id ?? "";
    this.готовый = з.готовый ?? null;
    this.рычаги = Array.isArray(з.рычаги)
      ? з.рычаги.map(р => ({ ...р, пульт: Math.min(Number(р.пульт) || 0, this.пульты.length - 1) }))
      : [];
    this.пометки = new Set((з.пометки ?? []).map(String));
    if (!this.готовый) this.#пересобрать();
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-u-okno"],
    tag: "div",
    window: { title: М("Устройство"), icon: "fa-solid fa-gears", resizable: true },
    position: { width: 1120, height: "auto" },
    actions: {
      пометить: ОкноПодготовкиУ.#пометить,
      пометитьВсе: ОкноПодготовкиУ.#пометитьВсе,
      снятьПометки: ОкноПодготовкиУ.#снятьПометки,
      другой: ОкноПодготовкиУ.#другой,
      механизм: ОкноПодготовкиУ.#механизм,
      перемешать: ОкноПодготовкиУ.#перемешать,
      поровну: ОкноПодготовкиУ.#поровну,
      вручную: ОкноПодготовкиУ.#вручную,
      выложить: ОкноПодготовкиУ.#выложить,
      запомнить: ОкноПодготовкиУ.#запомнить,
      закрыть: ОкноПодготовкиУ.#закрыть,
    },
  };

  get title() {
    const м = МЕХАНИЗМЫ[this.ключ];
    return this.н.заготовка ? `${Т(м.устройство)} — «${this.н.заготовка}»` : Т(м.устройство);
  }

  /** Собрать механизм заново. Подписи рычагов остаются за своими номерами. */
  #пересобрать(готовый = null) {
    const м = МЕХАНИЗМЫ[this.ключ];
    готовый ??= м.собрать(this.н);
    if (!готовый) return;
    this.готовый = готовый;
    const прежние = this.рычаги;
    const пультов = this.пульты?.length || 1;
    this.рычаги = перемешать(м.детали(готовый)).map((деталь, i) => ({
      деталь, подпись: прежние[i]?.подпись ?? "", пульт: прежние[i]?.пульт ?? (i % пультов),
    }));
    this.пометки = new Set();
  }

  /** Обновить механизм по настройкам, не трогая рычаги и пометки. */
  #обновить() {
    const готовый = МЕХАНИЗМЫ[this.ключ].собрать(this.н);
    if (готовый) this.готовый = готовый;
  }

  /** Снять набранное в полях: перерисовка иначе вернула бы прежнее. */
  #снять() {
    const э = this.element;
    if (!э) return null;
    const зн = имя => э.querySelector(`[name="${имя}"]`);
    const н = this.н;
    const было = Object.fromEntries(МЕХАНИЗМЫ[this.ключ].пересборка.map(к => [к, н[к]]));

    for (const имя of ["название", "подпись", "штурман", "подсказкаШтурману", "тема", "макрос", "заготовка"]) {
      if (зн(имя)) н[имя] = зн(имя).value.trim();
    }
    for (const имя of Object.keys(МЕХАНИЗМЫ[this.ключ].умолчания)) {
      if (зн(имя)) н[имя] = Number(зн(имя).value) || 0;
    }
    for (const имя of Object.keys(МЕХАНИЗМЫ[this.ключ].строки ?? {})) {
      if (зн(имя)) н[имя] = зн(имя).value;
    }
    for (const имя of Object.keys(МЕХАНИЗМЫ[this.ключ].флаги ?? {})) {
      if (зн(имя)) н[имя] = зн(имя).checked;
    }
    if (зн("таймерМин")) н.таймер = изМинСек(зн("таймерМин").value, зн("таймерСек")?.value);
    э.querySelectorAll("[data-podpis]").forEach(п => {
      const р = this.рычаги[Number(п.dataset.podpis)];
      if (р) р.подпись = п.value.trim();
    });
    э.querySelectorAll("[data-pult-kto]").forEach(в => { this.пульты[Number(в.dataset.pultKto)] = в.value; });
    э.querySelectorAll("[data-pult-rychag]").forEach(в => {
      const р = this.рычаги[Number(в.dataset.pultRychag)];
      if (р) р.пульт = Number(в.value) || 0;
    });
    const своё = МЕХАНИЗМЫ[this.ключ].снять?.(э, н) ?? null;
    if (своё === "пересобрать" || Object.entries(было).some(([к, v]) => н[к] !== v)) return "пересобрать";
    return своё;
  }

  конфиг() {
    return {
      ...this.н, механизм: this.ключ,
      готовый: this.готовый,
      рычаги: this.рычаги.map(р => ({ ...р })),
      пульты: [...this.пульты],
      пометки: [...this.пометки],
    };
  }

  static #пометить(event, target) {
    this.#снять();
    const к = String(target.dataset.kletka);
    if (this.пометки.has(к)) this.пометки.delete(к); else this.пометки.add(к);
    this.render();
  }

  static #пометитьВсе() {
    this.#снять();
    this.пометки = new Set(this.рычаги.map(р => р.деталь));
    this.render();
  }

  static #снятьПометки() { this.#снять(); this.пометки = new Set(); this.render(); }

  static #другой() {
    this.#снять();
    const м = МЕХАНИЗМЫ[this.ключ];
    if (м.другой) { м.другой(this.н); this.#обновить(); } else this.#пересобрать();
    this.render();
  }

  /** Свои кнопки механизма — у замка случайный код и начало. */
  static #механизм(event, target) {
    this.#снять();
    МЕХАНИЗМЫ[this.ключ].дело?.(target.dataset.delo, this.н);
    this.#обновить();
    this.render();
  }

  /** Собрать механизм руками — с того, что сейчас на экране. */
  static #вручную() {
    this.#снять();
    собратьВручную(this.готовый, зал => { this.#пересобрать(зал); this.render(); });
  }

  /** Перемешать, какой рычаг что двигает; подписи и пометки деталей остаются. */
  static #перемешать() {
    this.#снять();
    const детали = перемешать(this.рычаги.map(р => р.деталь));
    this.рычаги.forEach((р, i) => { р.деталь = детали[i]; });
    this.render();
  }

  /** Разложить рычаги по пультам по очереди: 1-й на первый, 2-й на второй… */
  static #поровну() {
    this.#снять();
    this.рычаги.forEach((р, i) => { р.пульт = i % this.пульты.length; });
    this.render();
  }

  /** Сколько пультов: рычаги раскладываются по ним заново, по очереди. */
  #пультов(сколько) {
    const n = Math.max(1, Math.min(this.рычаги.length || 1, Number(сколько) || 1));
    if (n === this.пульты.length) return;
    this.пульты = Array.from({ length: n }, (_, i) => this.пульты[i] ?? "");
    this.рычаги.forEach((р, i) => { р.пульт = i % n; });
  }

  static async #выложить() {
    this.#снять();
    const стол = await выложить(this.конфиг());
    if (стол) this.close();
  }

  static async #запомнить() {
    this.#снять();
    if (!this.н.заготовка) return void ui.notifications.warn(Т("Впишите имя заготовки."));
    await запомнить(`u-${this.ключ}`, this.н.заготовка, this.конфиг());
    ui.notifications.info(Т("Заготовка «{имя}» запомнена.", { имя: this.н.заготовка }));
    this.render();
  }

  static #закрыть() { this.close(); }

  _onRender() {
    // Размеры механизма меняются — он тут же собирается заново.
    this.element.querySelectorAll(".uo-u-nastrojki input, .uo-u-nastrojki select").forEach(поле =>
      поле.addEventListener("change", () => {
        const что = this.#снять();
        if (что === "пересобрать") this.#пересобрать();
        else if (что === "обновить") this.#обновить();
        if (что || поле.name === "тема" || поле.name === "штурман") this.render();
      }));
    // Число пультов и перенос рычага с пульта на пульт — сразу видно.
    this.element.querySelector(`[name="пультов"]`)?.addEventListener("change", событие => {
      this.#снять();
      this.#пультов(событие.target.value);
      this.render();
    });
    this.element.querySelectorAll("[data-pult-rychag]").forEach(в =>
      в.addEventListener("change", () => { this.#снять(); this.render(); }));
  }

  async _renderHTML() {
    const м = МЕХАНИЗМЫ[this.ключ];
    const н = this.н;
    const игроки = game.users.filter(u => !u.isGM);
    const темы = Object.entries(ТЕМЫ).map(([id, имя]) =>
      `<option value="${id}" ${id === н.тема ? "selected" : ""}>${Т(имя)}</option>`).join("");
    const штурманы = игроки.map(u =>
      `<option value="${u.id}" ${u.id === н.штурман ? "selected" : ""}>${экранировать(u.name)}</option>`).join("");

    const номерДетали = д => this.рычаги.findIndex(р => р.деталь === String(д)) + 1;
    const механизм = this.готовый
      ? м.рисовать(this.готовый, {
        действие: () => "пометить",
        номер: д => ({ н: номерДетали(д), тускло: !this.пометки.has(String(д)) }),
        класс: д => (this.пометки.has(String(д)) ? "uo-pomecheno" : ""),
      })
      : `<p class="uo-podskazka">${Т("Механизм не собрался — поменяйте размеры.")}</p>`;

    // Пульты: у каждого хозяин и свои рычаги; номера рычагов сквозные.
    const много = this.пульты.length > 1;
    const пульт = this.пульты.map((кто, п) => {
      const хозяева = [`<option value="">${Т("любой игрок")}</option>`, ...игроки.map(u =>
        `<option value="${u.id}" ${u.id === кто ? "selected" : ""}>${экранировать(u.name)}${u.id === н.штурман ? ` (${Т("штурман")})` : ""}</option>`)].join("");
      const рычаги = this.рычаги.map((р, i) => ((р.пульт ?? 0) !== п ? "" : `
        <div class="uo-rychag-pravka">
          <span class="uo-rychag-nomer">${i + 1}</span>
          <input type="text" data-podpis="${i}" value="${экранировать(р.подпись)}" placeholder="${Т("без подписи")}">
          ${много ? `<select data-pult-rychag="${i}" title="${Т("на какой пульт")}">${this.пульты.map((_, к) =>
            `<option value="${к}" ${к === п ? "selected" : ""}>${к + 1}</option>`).join("")}</select>` : ""}
        </div>`)).join("");
      return `
        <fieldset class="uo-u-pult-blok">
          <legend>${Т("Пульт {номер}", { номер: п + 1 })}</legend>
          <label>${Т("За пультом")} <select data-pult-kto="${п}">${хозяева}</select></label>
          ${рычаги || `<p class="uo-podskazka">${Т("Рычагов нет.")}</p>`}
        </fieldset>`;
    }).join("");

    return `
      <div class="uo-u-podgotovka">
        <section class="uo-u-nastrojki uo-forma">
          <h3>${Т("Настройки")}</h3>
          ${м.поля(н)}
          <label>${Т("Название")} <input type="text" name="название" value="${экранировать(н.название)}"></label>
          <label>${Т("Задача")} <input type="text" name="подпись" value="${экранировать(н.подпись)}" placeholder="${Т("«один у смотровой щели, остальные у рычагов»")}"></label>
          <label>${Т("Штурман")} <select name="штурман">${штурманы}</select></label>
          <label class="uo-u-podskazka-pole">${Т("Подсказка штурману")}
            <textarea name="подсказкаШтурману" rows="2" placeholder="${Т("необязательно — своих подсказок штурман не получит")}">${экранировать(н.подсказкаШтурману)}</textarea></label>
          ${полеТаймера(н.таймер)}
          <label>${Т("Оформление")} <select name="тема">${темы}</select></label>
          <label>${Т("Макрос при разгадке")} <input type="text" name="макрос" value="${экранировать(н.макрос)}" placeholder="${Т("необязательно")}"></label>
        </section>

        <section class="uo-u-mehanizm ${м.класс ?? "uo-prizmy-telo"} uo-tema-${экранировать(н.тема)}">
          <h3>${Т("Механизм — так его видит штурман")}</h3>
          <p class="uo-podskazka">${Т("Щёлкните деталь — пометить её номером рычага: штурман увидит номер. Непомеченную ему придётся «прозванивать» самому. Яркий номер — помечен, тусклый — виден только вам.")}</p>
          ${механизм}
          ${this.готовый ? `<p class="uo-podskazka">${м.сводка(this.готовый)}</p>` : ""}
          <div class="uo-gm-knopki">
            <button type="button" data-action="пометитьВсе">${Т("Пометить все")}</button>
            <button type="button" data-action="снятьПометки">${Т("Снять все")}</button>
            <button type="button" data-action="другой"><i class="fa-solid fa-rotate"></i> ${Т("Другой")}</button>
            ${м.вручную ? `<button type="button" data-action="вручную"><i class="fa-solid fa-pen-ruler"></i> ${Т("Собрать вручную…")}</button>` : ""}
          </div>
        </section>

        <section class="uo-u-pult">
          <h3>${Т("Пульты — так их видят остальные")}</h3>
          <p class="uo-podskazka">${Т("Подпишите рычаги, если нужно: без подписи на пульте будет только номер. Пульт с игроком видит только он; пульт «любой игрок» — все, кроме штурмана.")}</p>
          <label>${Т("Пультов")} <input type="number" name="пультов" value="${this.пульты.length}" min="1" max="${Math.max(1, this.рычаги.length)}" step="1"></label>
          <div class="uo-u-rychagi">${пульт}</div>
          <div class="uo-gm-knopki">
            <button type="button" data-action="перемешать"><i class="fa-solid fa-shuffle"></i> ${Т("Перемешать рычаги")}</button>
            ${много ? `<button type="button" data-action="поровну">${Т("Разложить поровну")}</button>` : ""}
          </div>
        </section>
      </div>

      <div class="uo-u-niz">
        <label>${Т("Запомнить как заготовку")} <input type="text" name="заготовка" value="${экранировать(н.заготовка)}" placeholder="${Т("имя, необязательно")}"></label>
        <div class="uo-cherda-deistvija">
          <button type="button" data-action="выложить"><i class="fa-solid fa-table-cells"></i> ${Т("Выложить на стол")}</button>
          <button type="button" data-action="запомнить"><i class="fa-solid fa-floppy-disk"></i> ${Т("Запомнить заготовку")}</button>
          <button type="button" data-action="закрыть">${Т("Закрыть")}</button>
        </div>
      </div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }
}

/** Открыть подготовку устройства — пустую или по заготовке. */
export function диалогШтурмана(заготовка = null, имяЗаготовки = "", ключ = заготовка?.механизм ?? "prizmy") {
  if (!game.user.isGM) return null;
  const окно = new ОкноПодготовкиУ({ заготовка, имяЗаготовки, ключ });
  окно.render({ force: true });
  return окно;
}

// У каждого механизма — своё устройство: свой тип заготовки и своя подготовка.
for (const [ключ, м] of Object.entries(МЕХАНИЗМЫ)) {
  ВИДЫ.set(`u-${ключ}`, {
    имя: м.устройство,
    выложить: конфиг => выложить({ ...конфиг, механизм: ключ }),
    диалог: (заготовка, имя) => диалогШтурмана(заготовка, имя, ключ),
  });
}

/* ──────────────────────────── окно рассадки ──────────────────────────── */

/*
 * Игрок вылетел, двое поменялись местами, кто-то отошёл — роли меняются
 * по ходу игры. Переигрывать выкладку ради этого нельзя: механизм соберётся
 * заново, и всё, что стол уже накрутил, пропадёт. Здесь меняется только
 * рассадка, а рычаги, пометки и подсказка остаются как были.
 */
export class ОкноРассадки extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.столId = options.столId;
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-rassadka"],
    tag: "div",
    window: { title: М("Кто где"), icon: "fa-solid fa-people-arrows" },
    position: { width: 460, height: "auto" },
    actions: {
      поменять: ОкноРассадки.#поменять,
      убратьПульт: ОкноРассадки.#убратьПульт,
      закрыть: ОкноРассадки.#закрыть,
    },
  };

  /* Заголовок переводится при показе: в DEFAULT_OPTIONS он ещё без словаря. */
  get title() { return Т("Кто где"); }

  get стол() { return столПоId(this.столId); }

  /** Записать новую рассадку, не трогая ничего другого на столе. */
  async #применить(вслепую) {
    const стол = this.стол;
    if (!стол || !вслепую) { this.render(); return; }
    await записать({ ...стол, вслепую });
    this.render();
  }

  /*
   * За столом эта просьба звучит как «мы меняемся местами», а не «назначь
   * штурманом того, кто у пульта». Пока мест два, так и делаем — одним
   * нажатием.
   */
  static async #поменять(event, target) {
    const в = посадить(this.стол?.вслепую, "штурман", target.dataset.kto);
    if (!в) return;
    await this.#применить(в);
    ui.notifications.info(Т("Поменялись местами"));
  }

  static async #убратьПульт(event, target) {
    const п = Number(target.dataset.pult);
    const куда = Number(this.element.querySelector(`[data-komu="${п}"]`)?.value ?? 0);
    const в = убратьПульт(this.стол?.вслепую, п, куда);
    if (!в) return;
    await this.#применить(в);
    ui.notifications.info(Т("Пульт убран, рычаги перешли другому"));
  }

  static #закрыть() { this.close(); }

  _replaceHTML(result, content) { content.innerHTML = result; }

  _onRender() {
    this.element.querySelectorAll("[data-mesto]").forEach(поле =>
      поле.addEventListener("change", async () => {
        const место = поле.dataset.mesto === "штурман" ? "штурман" : Number(поле.dataset.mesto);
        const в = посадить(this.стол?.вслепую, место, поле.value);
        if (!в) {
          ui.notifications.warn(Т("Так не выйдет: поле должен видеть кто-то из игроков."));
          this.render();
          return;
        }
        await this.#применить(в);
      }));
  }

  async _renderHTML() {
    const стол = this.стол;
    const в = стол?.вслепую;
    if (!в) return `<div class="uo-forma"><p class="uo-podskazka">${Т("Устройства нет на столе.")}</p></div>`;

    const игроки = game.users.filter(u => !u.isGM);
    const выбор = (текущий, пусто) => [
      пустойВыбор(пусто),
      ...игроки.map(u => `<option value="${u.id}" ${u.id === текущий ? "selected" : ""}>${
        экранировать(u.name)}${u.active ? "" : ` (${Т("не в игре")})`}</option>`),
    ].join("");

    const пульты = (в.пульты?.length ? в.пульты : [""]).map((кто, п) => {
      const сколько = (в.рычаги ?? []).filter(р => (Number(р.пульт) || 0) === п).length;
      const прочие = (в.пульты ?? []).map((_, к) => к).filter(к => к !== п);
      const кому = прочие.map(к => `<option value="${к}">${Т("Пульт {номер}", { номер: к + 1 })}</option>`).join("");
      return `
        <div class="uo-rassadka-strochka">
          <label>${Т("Пульт {номер}", { номер: п + 1 })}
            <select data-mesto="${п}">${выбор(кто, Т("любой игрок"))}</select></label>
          <span class="uo-podskazka">${Т("рычагов: {сколько}", { сколько })}</span>
          ${прочие.length ? `
            <span class="uo-rassadka-ubrat">
              <select data-komu="${п}">${кому}</select>
              <button type="button" data-action="убратьПульт" data-pult="${п}"
                data-tooltip="${Т("Рычаги перейдут выбранному пульту, номера не изменятся")}">${Т("Убрать пульт")}</button>
            </span>` : ""}
        </div>`;
    }).join("");

    // Двое за устройством — самый частый случай, и просьба у них одна.
    const пультыСписок = в.пульты?.length ? в.пульты : [""];
    const наДвоих = пультыСписок.length === 1 && пультыСписок[0]
      ? `<div class="uo-rassadka-strochka uo-rassadka-obmen">
          <button type="button" data-action="поменять" data-kto="${пультыСписок[0]}">
            <i class="fa-solid fa-people-arrows"></i> ${Т("Поменять местами")}</button>
          <span class="uo-podskazka">${Т("штурман встанет к пульту, а тот — к полю")}</span>
        </div>` : "";

    return `<div class="uo-forma">
      <p class="uo-podskazka">${Т("Меняется только рассадка: рычаги, пометки и подсказка остаются как были. Выберите человека, который уже где-то сидит, — и вы поменяетесь местами.")}</p>
      <div class="uo-rassadka-strochka">
        <label>${Т("Штурман")} <select data-mesto="штурман">${выбор(в.штурман, null)}</select></label>
        <span class="uo-podskazka">${Т("видит поле")}</span>
      </div>
      ${пульты}
      ${наДвоих}
      <footer class="uo-knopki"><button type="button" data-action="закрыть">${Т("Закрыть")}</button></footer>
    </div>`;
  }
}

/** Пустая строка выбора — только там, где место может быть бесхозным. */
function пустойВыбор(подпись) {
  return подпись ? `<option value="">${подпись}</option>` : "";
}

/** Открыть рассадку для стола: зовётся из окон призм и замка. */
export function рассадка(стол) {
  if (!game.user.isGM || !стол?.вслепую) return null;
  return new ОкноРассадки({ id: `uo-rassadka-${стол.id}`, столId: стол.id }).render({ force: true });
}

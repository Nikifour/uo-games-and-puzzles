/**
 * Череда — разложить картинки по клеткам поля так, как задумал ведущий.
 *
 * Поле — не обязательно строка: сетка любой формы, от 1 × 5 (фрески в порядке
 * событий) до 3 × 3 (гербы по местам на щите). Ведущий расставляет картинки
 * в окне подготовки так, как они стоят в разгадке, и у каждой выбирает роль:
 *
 * - **закреплена** — лежит на своём месте с самого начала и видна игрокам,
 *   это подсказка;
 * - **на выбор** — уходит в выбор под полем, и её можно положить в любую клетку.
 *
 * Сверх того ведущий может добавить **приманки**: лишние картинки в выборе,
 * которым на поле места нет. Игроки не знают, сколько из выбора лишнего.
 *
 * Пустые клетки разгадки — «глухие»: туда ничего не положить, так поле
 * получает форму. Ведущий может снять это, и тогда пустая клетка — такая же,
 * как все, только верный ответ для неё — оставить её пустой.
 *
 * Тайна: картинки лежат на столе одним перетасованным списком, и какая
 * из них приманка, а какая куда идёт, знает только ведущий. Ответ хранится
 * по клеткам ключом «путь|подпись», поэтому одинаковые картинки
 * взаимозаменяемы — две одинаковые свечи не спорят, кто из них «настоящая».
 */

import {
  ВИДЫ, всеСтолы, столПоId, записать, убрать, тайна, тайнуЗапомнить,
  просить, разослать, собрать, объявить, событие, запуститьМакрос, имяИгрока,
  забытьОкно, спрятать, спрятатьУСебя, ТЕМЫ,
} from "./stol.mjs";
import * as наборы from "./nabory.mjs";
import { Т, М } from "./yazyk.mjs";
import { запомнить } from "./zagotovki.mjs";

const { ApplicationV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

export const СТРОК_НАИБОЛЬШЕ = 12;
export const СТОЛБЦОВ_НАИБОЛЬШЕ = 12;

const вПределах = (ч, от, до, умолчание) => {
  const н = Math.floor(Number(ч));
  return Number.isFinite(н) ? Math.min(до, Math.max(от, н)) : умолчание;
};

const кусок = к => (к?.путь ? { путь: String(к.путь), подпись: String(к.подпись ?? "") } : null);

/** Ключ картинки: одинаковые по пути и подписи — одна и та же картинка. */
export const ключ = к => (к ? `${к.путь}|${к.подпись ?? ""}` : null);

function перемешать(список) {
  const м = [...список];
  for (let i = м.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [м[i], м[j]] = [м[j], м[i]];
  }
  return м;
}

/* ─────────────────────────── настройки загадки ─────────────────────────── */

/**
 * Настройки в единый вид: `{строк, столбцов, поле, приманки, глухие}`.
 *
 * Старые заготовки помнят только набор или список картинок — порядок строк
 * набора и был ответом. Они становятся полем в одну строку, где всё на выбор:
 * загадка та же, что и была.
 */
export function разобратьКонфиг(конфиг = {}) {
  if (!Array.isArray(конфиг.поле)) {
    const исходные = (конфиг.картинки?.length
      ? конфиг.картинки
      : наборы.пул()[Number(конфиг.набор)]?.картинки) ?? [];
    const поле = исходные.map(кусок).filter(Boolean).map(к => ({ ...к, закреплён: false }));
    return { строк: 1, столбцов: Math.max(1, поле.length), поле, приманки: [], глухие: true };
  }

  const строк = вПределах(конфиг.строк, 1, СТРОК_НАИБОЛЬШЕ, 1);
  const столбцов = вПределах(конфиг.столбцов, 1, СТОЛБЦОВ_НАИБОЛЬШЕ, 4);
  const поле = Array.from({ length: строк * столбцов }, (_, i) => {
    const к = кусок(конфиг.поле[i]);
    return к ? { ...к, закреплён: !!конфиг.поле[i].закреплён } : null;
  });
  return {
    строк, столбцов, поле,
    приманки: (конфиг.приманки ?? []).map(кусок).filter(Boolean),
    глухие: конфиг.глухие !== false,
  };
}

/** Поле под новый размер: картинка остаётся в своей строке и столбце, если они есть. */
export function переразметить(поле, было, стало) {
  const новое = Array(стало.строк * стало.столбцов).fill(null);
  let потеряно = 0;
  поле.forEach((к, i) => {
    if (!к) return;
    const строка = Math.floor(i / было.столбцов);
    const столбец = i % было.столбцов;
    if (строка < стало.строк && столбец < стало.столбцов) новое[строка * стало.столбцов + столбец] = к;
    else потеряно++;
  });
  return { поле: новое, потеряно };
}

/* ─────────────────────────── выложить на стол ─────────────────────────── */

export async function выложить(конфиг = {}) {
  if (!game.user.isGM) return null;

  const р = разобратьКонфиг(конфиг);
  if (!р.поле.some(к => к && !к.закреплён)) {
    ui.notifications.error(Т("На поле нет ни одной картинки «на выбор» — игрокам нечего расставлять."));
    return null;
  }

  // Все картинки — одним перетасованным списком: ни порядок, ни соседство
  // не выдают, где чья клетка и что здесь приманка.
  const перечень = перемешать([
    ...р.поле.map((к, клетка) => (к ? { к, клетка } : null)).filter(Boolean),
    ...р.приманки.map(к => ({ к, клетка: null })),
  ]);
  const картинки = перечень.map(({ к }) => ({ путь: к.путь, подпись: к.подпись }));
  const клетки = р.поле.map(() => null);
  const закреплённые = [];
  const запас = [];
  перечень.forEach(({ к, клетка }, и) => {
    if (клетка !== null && к.закреплён) { клетки[клетка] = и; закреплённые.push(клетка); }
    else запас.push(и);
  });

  await прибрать();

  const id = foundry.utils.randomID();
  const стол = {
    id,
    тип: "porjadok",
    название: конфиг.название?.trim() || Т("Череда"),
    подпись: конфиг.подпись?.trim() || "",
    тема: (конфиг.тема in ТЕМЫ) ? конфиг.тема : "kamen",
    строк: р.строк,
    столбцов: р.столбцов,
    картинки,
    клетки,                                        // номер картинки в клетке или null
    закреплённые: закреплённые.sort((a, b) => a - b),
    глухие: р.глухие ? р.поле.map((к, i) => (к ? null : i)).filter(i => i !== null) : [],
    запас,                                         // что лежит в выборе под полем
    попытки: { сделано: 0, предел: Math.max(0, Number(конфиг.предел) || 0) },
    подсказка: конфиг.подсказка === "сколько" ? "сколько" : "нет",
    двигают: конфиг.двигают?.length ? конфиг.двигают : "все",
    макрос: конфиг.макрос?.trim() || null,
    журнал: [],
    сложена: false,
    заклинило: false,
    завершён: false,
    показан: true,
  };

  await тайнуЗапомнить(id, { верный: р.поле.map(ключ) });
  await записать(стол);
  return стол;
}

export async function прибрать() {
  for (const [id, с] of Object.entries(всеСтолы())) {
    if (с.тип === "porjadok" && с.завершён) await убрать(id);
  }
}

/* ─────────────────────────────── правила ─────────────────────────────── */

const можетДвигать = (стол, пользователь) =>
  !!пользователь && !стол.сложена && !стол.заклинило &&
  (пользователь.isGM || стол.двигают === "все" || (стол.двигают ?? []).includes(пользователь.id));

const осталосьПопыток = стол =>
  стол.попытки.предел ? стол.попытки.предел - стол.попытки.сделано : Infinity;

/** Клетка, в которую можно класть: не закреплённая и не глухая. */
export const подвижная = (стол, клетка) =>
  Number.isInteger(клетка) && клетка >= 0 && клетка < стол.клетки.length &&
  !стол.закреплённые.includes(клетка) && !(стол.глухие ?? []).includes(клетка);

/**
 * Переложить картинку: в клетку или обратно в выбор.
 *
 * Занятая клетка отдаёт свою картинку туда, откуда пришла новая: из клетки —
 * меняются местами, из выбора — прежняя встаёт в выбор на её место.
 * Возвращает `{клетки, запас}` или `null`, если так нельзя.
 */
export function переложить(стол, кусокИ, куда) {
  if (!Number.isInteger(кусокИ) || !стол.картинки[кусокИ]) return null;
  const клетки = [...стол.клетки];
  const запас = [...стол.запас];
  const изКлетки = клетки.indexOf(кусокИ);
  const изЗапаса = запас.indexOf(кусокИ);
  if (изКлетки < 0 && изЗапаса < 0) return null;
  if (изКлетки >= 0 && !подвижная(стол, изКлетки)) return null;

  if (куда === "запас") {
    if (изКлетки < 0) return null;
    клетки[изКлетки] = null;
    запас.push(кусокИ);
    return { клетки, запас };
  }

  if (!подвижная(стол, куда) || куда === изКлетки) return null;
  const жилец = клетки[куда];
  клетки[куда] = кусокИ;
  if (изКлетки >= 0) клетки[изКлетки] = жилец;
  else if (жилец === null) запас.splice(изЗапаса, 1);
  else запас[изЗапаса] = жилец;
  return { клетки, запас };
}

/** Сколько картинок на своих местах и сошлось ли всё. Закреплённые не в счёт. */
export function сверить(стол, верный) {
  let наМестах = 0, всего = 0, сошлось = true;
  стол.клетки.forEach((и, клетка) => {
    if (!подвижная(стол, клетка)) return;
    const надо = верный[клетка] ?? null;
    const лежит = и === null ? null : ключ(стол.картинки[и]);
    if (надо !== null) {
      всего++;
      if (лежит === надо) наМестах++;
    }
    if (лежит !== надо) сошлось = false;
  });
  return { наМестах, всего, сошлось };
}

/** Картинки, которые можно двигать: всё, кроме закреплённых. */
const свободныеКартинки = стол => {
  const занятые = new Set(стол.закреплённые.map(к => стол.клетки[к]));
  return стол.картинки.map((_, и) => и).filter(и => !занятые.has(и));
};

const пустоеПоле = стол => стол.клетки.map((и, клетка) => (подвижная(стол, клетка) ? null : и));

/** Разложить как надо — для «Засчитать». Лишнее уходит в выбор. */
export function разложитьВерно(стол, верный) {
  const свободные = свободныеКартинки(стол);
  const клетки = пустоеПоле(стол);
  клетки.forEach((_, клетка) => {
    if (!подвижная(стол, клетка) || !верный[клетка]) return;
    const н = свободные.findIndex(и => ключ(стол.картинки[и]) === верный[клетка]);
    if (н >= 0) клетки[клетка] = свободные.splice(н, 1)[0];
  });
  return { клетки, запас: свободные };
}

// Перекладывают чаще, чем стоит писать в базу.
const отложитьЗапись = foundry.utils.debounce(async id => {
  const сырой = столПоId(id);
  if (!сырой) return;
  const живой = собрать(сырой);
  await записать({ ...сырой, клетки: живой.клетки, запас: живой.запас });
}, 4000);

async function ход(стол, запрос) {
  const пользователь = game.users.get(запрос.кто);
  if (!можетДвигать(стол, пользователь)) return;

  if (запрос.что === "переложить") {
    const итог = переложить(стол, Number(запрос.кусок), запрос.куда === "запас" ? "запас" : Number(запрос.куда));
    if (!итог) return;
    разослать(стол.id, итог);
    отложитьЗапись(стол.id);
    return;
  }

  if (запрос.что === "проверить") await проверить(стол, запрос.кто);
}

async function проверить(стол, ктоId) {
  if (осталосьПопыток(стол) <= 0) return;

  const верный = тайна(стол.id)?.верный;
  if (!верный) {
    ui.notifications.error(Т("Ответ для «{название}» не найден в этом браузере. Засчитайте вручную или выложите заново.",
      { название: стол.название }));
    return;
  }

  const { наМестах, всего, сошлось } = сверить(стол, верный);

  const обновлённый = {
    ...стол,
    попытки: { ...стол.попытки, сделано: стол.попытки.сделано + 1 },
    журнал: [...стол.журнал, {
      кто: имяИгрока(ктоId),
      наМестах: стол.подсказка === "сколько" ? наМестах : null,
      всего,
      удача: сошлось,
    }].slice(-10),
    сложена: сошлось,
    завершён: сошлось,
  };

  if (!сошлось && обновлённый.попытки.предел &&
      обновлённый.попытки.сделано >= обновлённый.попытки.предел) {
    обновлённый.заклинило = true;
    обновлённый.завершён = true;
  }

  await записать(обновлённый);

  if (сошлось) {
    await объявить(
      Т(`<p><strong>{название}</strong> — череда сошлась.</p>
       <p><em>{ктоId} угадал с попытки номер {сделано}.</em></p>`, { название: экранировать(обновлённый.название), ктоId: экранировать(имяИгрока(ктоId)), сделано: обновлённый.попытки.сделано }),
      обновлённый.название);
    событие("решено", обновлённый);
    await запуститьМакрос(обновлённый.макрос, обновлённый);
  } else if (обновлённый.заклинило) {
    await объявить(
      Т(`<p><strong>{название}</strong> — попытки кончились.</p>`, { название: экранировать(обновлённый.название) }), обновлённый.название);
  }
}

/* ─────────────────── рычаги ведущего (нажимает он сам) ─────────────────── */

export async function засчитать(id) {
  const сырой = столПоId(id);
  if (!сырой) return;
  const стол = собрать(сырой);
  const верный = тайна(id)?.верный;
  const полный = {
    ...стол,
    ...(верный ? разложитьВерно(стол, верный) : {}),
    сложена: true, заклинило: false, завершён: true,
  };
  await записать(полный);
  await объявить(Т(`<p><strong>{название}</strong> — сложена волей ведущего.</p>`, { название: экранировать(полный.название) }), полный.название);
  событие("решено", полный);
  await запуститьМакрос(полный.макрос, полный);
}

/** Перетасовать: всё подвижное — обратно в выбор, попытки заново. */
export async function сбросить(id) {
  const стол = столПоId(id);
  if (!стол) return;
  await записать({
    ...стол,
    клетки: пустоеПоле(стол),
    запас: перемешать(свободныеКартинки(стол)),
    попытки: { ...стол.попытки, сделано: 0 },
    журнал: [],
    сложена: false,
    заклинило: false,
    завершён: false,
  });
}

/* ──────────────────────────── окно игроков ──────────────────────────── */

const ширинаОкна = столбцов => Math.min(920, Math.max(440, столбцов * 116 + 60));

class ОкноПорядка extends ApplicationV2 {
  constructor(options = {}) {
    super({ ...options, position: { width: ширинаОкна(options.стол?.столбцов ?? 4), ...(options.position ?? {}) } });
    this.стол = options.стол;
    this.ответВидно = false;
    this.вРуке = null;              // номер картинки; у каждого своя рука
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-cherda-okno"],
    tag: "div",
    window: { title: М("Череда"), icon: "fa-solid fa-table-cells", resizable: true },
    position: { width: 560, height: "auto" },
    actions: {
      кусок: ОкноПорядка.#кусок,
      клетка: ОкноПорядка.#клетка,
      вЗапас: ОкноПорядка.#вЗапас,
      проверить: ОкноПорядка.#проверить,
      крупно: ОкноПорядка.#крупно,
      ответВидно: ОкноПорядка.#ответВидно,
      засчитать: ОкноПорядка.#засчитать,
      сброс: ОкноПорядка.#сброс,
      снять: ОкноПорядка.#снять,
    },
  };

  get title() { return this.стол?.название ?? Т("Череда"); }

  #переложить(кусокИ, куда) {
    this.вРуке = null;
    просить({ id: this.стол.id, что: "переложить", кусок: кусокИ, куда });
    this.render();
  }

  /** Щелчок по картинке в выборе: взять в руку или положить обратно. */
  static #кусок(event, target) {
    if (!можетДвигать(this.стол, game.user)) return;
    const и = Number(target.dataset.kusok);
    this.вРуке = this.вРуке === и ? null : и;
    this.render();
  }

  /** Щелчок по клетке: положить то, что в руке, или взять лежащее. */
  static #клетка(event, target) {
    if (!можетДвигать(this.стол, game.user)) return;
    const клетка = Number(target.dataset.kletka);
    if (!подвижная(this.стол, клетка)) return;
    const лежит = this.стол.клетки[клетка];

    if (this.вРуке !== null) {
      if (this.вРуке === лежит) { this.вРуке = null; this.render(); return; }
      this.#переложить(this.вРуке, клетка);
      return;
    }
    if (лежит !== null) { this.вРуке = лежит; this.render(); }
  }

  static #вЗапас() {
    if (this.вРуке === null || !this.стол.клетки.includes(this.вРуке)) return;
    this.#переложить(this.вРуке, "запас");
  }

  static #проверить() { this.вРуке = null; просить({ id: this.стол.id, что: "проверить" }); }

  static #крупно(event, target) {
    const к = this.стол.картинки[Number(target.dataset.kusok)];
    if (!к) return;
    new foundry.applications.apps.ImagePopout({
      src: к.путь,
      window: { title: к.подпись || this.стол.название },
    }).render(true);
  }

  static #ответВидно() { this.ответВидно = !this.ответВидно; this.render(); }
  static #засчитать() { засчитать(this.стол.id); }
  static #сброс() { сбросить(this.стол.id); }
  static #снять() { убрать(this.стол.id); }

  /*
   * Перетаскивание — поверх щелчков, тем же запросом. Слушаем на корне окна:
   * содержимое перерисовывается, а корень живёт, пока открыто окно.
   */
  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    const корень = this.element;

    корень.addEventListener("dragstart", event => {
      const к = event.target.closest?.("[data-kusok][draggable='true']");
      if (!к || !можетДвигать(this.стол, game.user)) return;
      event.dataTransfer.setData("text/plain", JSON.stringify({ uoCherda: this.стол.id, кусок: Number(к.dataset.kusok) }));
      event.dataTransfer.effectAllowed = "move";
    });
    корень.addEventListener("dragover", event => {
      if (event.target.closest?.(".uo-cherda-pole [data-kletka], .uo-cherda-zapas")) event.preventDefault();
    });
    корень.addEventListener("drop", event => {
      const клетка = event.target.closest?.(".uo-cherda-pole [data-kletka]");
      const запас = event.target.closest?.(".uo-cherda-zapas");
      if (!клетка && !запас) return;
      event.preventDefault();
      event.stopPropagation();
      let д;
      try { д = JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return; }
      if (д?.uoCherda !== this.стол.id) return;
      this.#переложить(д.кусок, клетка ? Number(клетка.dataset.kletka) : "запас");
    });
    // Правая кнопка по картинке на поле — вернуть её в выбор.
    корень.addEventListener("contextmenu", event => {
      const клетка = event.target.closest?.(".uo-cherda-pole [data-kletka]");
      if (!клетка || !можетДвигать(this.стол, game.user)) return;
      const н = Number(клетка.dataset.kletka);
      const лежит = this.стол.клетки[н];
      if (лежит === null || !подвижная(this.стол, н)) return;
      event.preventDefault();
      this.#переложить(лежит, "запас");
    });
  }

  _onClose() {
    забытьОкно(this.стол.id);
    if (this.закрываемСами) return;
    if (game.user.isGM) спрятать(this.стол.id);
    else спрятатьУСебя(this.стол.id);
  }

  #картинка(и, { тянуть, действие = "" } = {}) {
    const к = this.стол.картинки[и] ?? {};
    return `
      <figure class="uo-cherda-kusok ${this.вРуке === и ? "uo-vzjata" : ""}" data-kusok="${и}"
              draggable="${тянуть ? "true" : "false"}" ${действие ? `data-action="${действие}"` : ""}>
        <img src="${экранировать(к.путь)}" alt="" draggable="false">
        ${к.подпись ? `<figcaption>${экранировать(к.подпись)}</figcaption>` : ""}
        <button type="button" class="uo-cherda-lupa" data-action="крупно" data-kusok="${и}" title="${Т("крупно")}">
          <i class="fa-solid fa-magnifying-glass-plus"></i></button>
      </figure>`;
  }

  async _renderHTML() {
    const с = this.стол;
    const двигает = можетДвигать(с, game.user);
    if (this.вРуке !== null && !с.запас.includes(this.вРуке) && !с.клетки.some((и, к) => и === this.вРуке && подвижная(с, к))) {
      this.вРуке = null;
    }
    const рукаСПоля = this.вРуке !== null && с.клетки.includes(this.вРуке);

    const поле = с.клетки.map((и, клетка) => {
      const закреплена = с.закреплённые.includes(клетка);
      const глухая = (с.глухие ?? []).includes(клетка);
      if (глухая) return `<div class="uo-cherda-kletka uo-gluhaja"></div>`;
      return `
        <div class="uo-cherda-kletka ${закреплена ? "uo-zakreplena" : ""} ${двигает && !закреплена ? "uo-mozhno" : ""}"
             data-kletka="${клетка}" ${двигает && !закреплена ? `data-action="клетка"` : ""}>
          <span class="uo-cherda-nomer">${закреплена ? `<i class="fa-solid fa-lock"></i>` : клетка + 1}</span>
          ${и !== null ? this.#картинка(и, { тянуть: двигает && !закреплена }) : ""}
        </div>`;
    }).join("");

    const запас = с.запас.length
      ? с.запас.map(и => this.#картинка(и, { тянуть: двигает, действие: двигает ? "кусок" : "" })).join("")
      : `<p class="uo-podskazka">${Т("Выбор пуст — всё разложено по полю.")}</p>`;

    const остаток = осталосьПопыток(с);
    const счёт = с.попытки.предел
      ? Т("Попытка {номер} из {предел}", { номер: Math.min(с.попытки.сделано + 1, с.попытки.предел), предел: с.попытки.предел })
      : Т("Попыток сделано: {сделано}", { сделано: с.попытки.сделано });

    const журнал = с.журнал.length ? `
      <ol class="uo-zhurnal">
        ${[...с.журнал].reverse().map(з => `
          <li class="${з.удача ? "uo-udacha" : ""}">
            <span class="uo-kto">${экранировать(з.кто)}</span>
            ${з.удача ? Т("— сошлось") : (з.наМестах ?? null) !== null
              ? `<span class="uo-podskazka">${Т("на своих местах: {наМестах} из {всего}", { наМестах: з.наМестах, всего: з.всего ?? "?" })}</span>`
              : Т("— мимо")}
          </li>`).join("")}
      </ol>` : "";

    const итог = с.сложена
      ? `<p class="uo-itog uo-otkryt">${Т("Череда сошлась.")}</p>`
      : с.заклинило
        ? `<p class="uo-itog uo-zaklinilo">${Т("Попытки кончились. Ведущий может дать ещё.")}</p>`
        : "";

    const гм = game.user.isGM ? `
      <section class="uo-gm">
        <div class="uo-gm-kod">
          <button type="button" data-action="ответВидно">${this.ответВидно ? Т("Скрыть ответ") : Т("Показать ответ")}</button>
        </div>
        ${this.ответВидно ? this.#ответ() : ""}
        <div class="uo-gm-knopki">
          <button type="button" data-action="засчитать">${Т("Засчитать")}</button>
          <button type="button" data-action="сброс">${Т("Перетасовать")}</button>
          <button type="button" data-action="снять">${Т("Убрать со стола")}</button>
        </div>
      </section>` : "";

    return `
      <div class="uo-cherda-telo uo-tema-${экранировать(с.тема)}">
        ${с.подпись ? `<p class="uo-podpis">${экранировать(с.подпись)}</p>` : ""}
        <div class="uo-cherda-pole" style="--stolbcov: ${с.столбцов}">${поле}</div>
        <div class="uo-cherda-zapas ${рукаСПоля ? "uo-mozhno" : ""}" ${рукаСПоля ? `data-action="вЗапас"` : ""}>
          <div class="uo-cherda-zagolovok">${Т("На выбор")}${рукаСПоля ? ` <span class="uo-podskazka">${Т("— щёлкните сюда, чтобы вернуть картинку")}</span>` : ""}</div>
          <div class="uo-cherda-kuski">${запас}</div>
        </div>
        ${двигает ? `<p class="uo-podskazka">${Т("Возьмите картинку из выбора и положите в клетку — щелчками или перетаскиванием. Правая кнопка по картинке на поле возвращает её в выбор.")}</p>` : ""}
        <div class="uo-stroka">
          <span class="uo-schet">${счёт}</span>
          ${двигает && остаток > 0
            ? `<button type="button" class="uo-proverit" data-action="проверить"><i class="fa-solid fa-hand-point-down"></i> ${Т("Потянуть рычаг")}</button>`
            : ""}
        </div>
        ${итог}
        ${журнал}
        ${гм}
      </div>`;
  }

  /** Разгадка мелкой сеткой — видна только ведущему. */
  #ответ() {
    const с = this.стол;
    const верный = тайна(с.id)?.верный;
    if (!верный) return `<p class="uo-podskazka">${Т("— в этом браузере неизвестен —")}</p>`;
    const клетки = верный.map((кл, клетка) => {
      const к = кл ? с.картинки.find(п => ключ(п) === кл) : null;
      const закреплена = с.закреплённые.includes(клетка);
      return `<div class="uo-cherda-kletka ${к ? "" : "uo-gluhaja"} ${закреплена ? "uo-zakreplena" : ""}"
                   title="${экранировать(к?.подпись ?? "")}">${к ? `<img src="${экранировать(к.путь)}" alt="">` : ""}</div>`;
    }).join("");
    return `<div class="uo-cherda-pole uo-cherda-otvet" style="--stolbcov: ${с.столбцов}">${клетки}</div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }
}

/* ─────────────────────────── окно подготовки ─────────────────────────── */

/**
 * Ведущий собирает загадку прямо на поле: берёт картинку из набора (или свой
 * файл), щёлкает клетку, замком отмечает подсказки. Поле, выбор и приманки
 * видны разом — так, как их потом увидят игроки, только с ответом.
 */
export class ОкноПодготовки extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    const з = options.заготовка ?? null;
    const р = разобратьКонфиг(з ?? { поле: [], строк: 1, столбцов: 5 });
    this.н = {
      название: з?.название ?? Т("Череда"),
      подпись: з?.подпись ?? "",
      тема: з?.тема ?? "kamen",
      предел: Number(з?.предел) || 0,
      подсказка: з?.подсказка === "сколько" ? "сколько" : "нет",
      двигают: Array.isArray(з?.двигают) ? з.двигают : [],
      макрос: з?.макрос ?? "",
      заготовка: options.имяЗаготовки ?? "",
      ...р,
    };
    this.набор = 0;
    this.вРуке = null;   // {откуда: "набор", к} | {откуда: "клетка", клетка} | {откуда: "приманка", н}
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-cherda-podgotovka-okno"],
    tag: "div",
    window: { title: М("Новая череда"), icon: "fa-solid fa-table-cells", resizable: true },
    position: { width: 860, height: "auto" },
    actions: {
      изНабора: ОкноПодготовки.#изНабора,
      свойФайл: ОкноПодготовки.#свойФайл,
      клетка: ОкноПодготовки.#клетка,
      закрепить: ОкноПодготовки.#закрепить,
      очистить: ОкноПодготовки.#очистить,
      вПриманки: ОкноПодготовки.#вПриманки,
      приманка: ОкноПодготовки.#приманка,
      убратьПриманку: ОкноПодготовки.#убратьПриманку,
      строкой: ОкноПодготовки.#строкой,
      очиститьПоле: ОкноПодготовки.#очиститьПоле,
      наборы: ОкноПодготовки.#наборы,
      выложить: ОкноПодготовки.#выложить,
      запомнить: ОкноПодготовки.#запомнить,
      закрыть: ОкноПодготовки.#закрыть,
    },
  };

  get title() {
    return this.н.заготовка ? Т("Череда: заготовка «{имя}»", { имя: this.н.заготовка }) : Т("Новая череда");
  }

  /** Настройки загадки в том виде, в каком их берут `выложить` и склад заготовок. */
  настройки() {
    const н = this.н;
    return {
      название: н.название, подпись: н.подпись, тема: н.тема,
      строк: н.строк, столбцов: н.столбцов,
      поле: н.поле.map(к => (к ? { путь: к.путь, подпись: к.подпись, закреплён: !!к.закреплён } : null)),
      приманки: н.приманки.map(к => ({ путь: к.путь, подпись: к.подпись })),
      глухие: н.глухие,
      предел: н.предел, подсказка: н.подсказка, двигают: [...н.двигают], макрос: н.макрос,
    };
  }

  /** Снять набранное в полях формы: перерисовка иначе вернула бы прежнее. */
  #снять() {
    const э = this.element;
    if (!э) return;
    const зн = имя => э.querySelector(`[name="${имя}"]`);
    const н = this.н;
    for (const имя of ["название", "подпись", "тема", "подсказка", "макрос", "заготовка"]) {
      if (зн(имя)) н[имя] = зн(имя).value.trim();
    }
    if (зн("предел")) н.предел = Math.max(0, Number(зн("предел").value) || 0);
    if (зн("глухие")) н.глухие = зн("глухие").checked;
    if (зн("набор")) this.набор = Number(зн("набор").value) || 0;
    const поимённо = э.querySelector(`[name="кто"][value="отмеченные"]`)?.checked;
    н.двигают = поимённо ? [...э.querySelectorAll(`[name="игрок"]:checked`)].map(и => и.value) : [];

    const строк = вПределах(зн("строк")?.value, 1, СТРОК_НАИБОЛЬШЕ, н.строк);
    const столбцов = вПределах(зн("столбцов")?.value, 1, СТОЛБЦОВ_НАИБОЛЬШЕ, н.столбцов);
    if (строк !== н.строк || столбцов !== н.столбцов) this.размер(строк, столбцов);
  }

  размер(строк, столбцов) {
    const { поле, потеряно } = переразметить(this.н.поле, this.н, { строк, столбцов });
    Object.assign(this.н, { строк, столбцов, поле });
    this.вРуке = null;
    if (потеряно) ui.notifications.warn(Т("Не поместилось в поле картинок: {сколько} — они убраны.", { сколько: потеряно }));
  }

  #взятое() {
    const р = this.вРуке;
    if (!р) return null;
    if (р.откуда === "набор") return { ...р.к };
    if (р.откуда === "клетка") return this.н.поле[р.клетка];
    if (р.откуда === "приманка") return this.н.приманки[р.н];
    return null;
  }

  static #изНабора(event, target) {
    this.#снять();
    const к = наборы.пул()[this.набор]?.картинки?.[Number(target.dataset.kartinka)];
    if (!к) return;
    const тот = this.вРуке?.откуда === "набор" && this.вРуке.к.путь === к.путь && this.вРуке.к.подпись === (к.подпись ?? "");
    this.вРуке = тот ? null : { откуда: "набор", к: { путь: к.путь, подпись: к.подпись ?? "" } };
    this.render();
  }

  static async #свойФайл() {
    this.#снять();
    const выбор = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      callback: путь => { this.вРуке = { откуда: "набор", к: { путь, подпись: "" } }; this.render(); },
    });
    await выбор.browse();
  }

  static #клетка(event, target) {
    this.#снять();
    const клетка = Number(target.dataset.kletka);
    const поле = this.н.поле;
    const р = this.вРуке;

    if (!р) {
      if (поле[клетка]) this.вРуке = { откуда: "клетка", клетка };
    } else if (р.откуда === "набор") {
      поле[клетка] = { ...р.к, закреплён: false };
      this.вРуке = null;
    } else if (р.откуда === "клетка") {
      if (р.клетка !== клетка) [поле[р.клетка], поле[клетка]] = [поле[клетка], поле[р.клетка]];
      this.вРуке = null;
    } else if (р.откуда === "приманка") {
      const [к] = this.н.приманки.splice(р.н, 1);
      if (поле[клетка]) this.н.приманки.push({ путь: поле[клетка].путь, подпись: поле[клетка].подпись });
      поле[клетка] = { ...к, закреплён: false };
      this.вРуке = null;
    }
    this.render();
  }

  static #закрепить(event, target) {
    this.#снять();
    const к = this.н.поле[Number(target.dataset.kletka)];
    if (к) к.закреплён = !к.закреплён;
    this.render();
  }

  static #очистить(event, target) {
    this.#снять();
    this.н.поле[Number(target.dataset.kletka)] = null;
    this.вРуке = null;
    this.render();
  }

  static #вПриманки() {
    this.#снять();
    const к = this.#взятое();
    if (!к || this.вРуке.откуда === "приманка") return;
    this.н.приманки.push({ путь: к.путь, подпись: к.подпись ?? "" });
    if (this.вРуке.откуда === "клетка") this.н.поле[this.вРуке.клетка] = null;
    this.вРуке = null;
    this.render();
  }

  static #приманка(event, target) {
    this.#снять();
    const н = Number(target.dataset.primanka);
    this.вРуке = this.вРуке?.откуда === "приманка" && this.вРуке.н === н ? null : { откуда: "приманка", н };
    this.render();
  }

  static #убратьПриманку(event, target) {
    this.#снять();
    this.н.приманки.splice(Number(target.dataset.primanka), 1);
    this.вРуке = null;
    this.render();
  }

  /** Весь набор — полем в одну строку, как была старая череда. */
  static #строкой() {
    this.#снять();
    const картинки = наборы.пул()[this.набор]?.картинки ?? [];
    if (!картинки.length) return;
    const взять = картинки.slice(0, СТОЛБЦОВ_НАИБОЛЬШЕ);
    Object.assign(this.н, {
      строк: 1, столбцов: взять.length,
      поле: взять.map(к => ({ путь: к.путь, подпись: к.подпись ?? "", закреплён: false })),
    });
    if (картинки.length > взять.length) {
      ui.notifications.warn(Т("Не поместилось в поле картинок: {сколько} — они убраны.", { сколько: картинки.length - взять.length }));
    }
    this.вРуке = null;
    this.render();
  }

  static #очиститьПоле() {
    this.#снять();
    this.н.поле = this.н.поле.map(() => null);
    this.н.приманки = [];
    this.вРуке = null;
    this.render();
  }

  static async #наборы() {
    await наборы.редактор();
    this.#снять();
    this.render();
  }

  static async #выложить() {
    this.#снять();
    const настройки = this.настройки();
    if (this.н.заготовка) await запомнить("porjadok", this.н.заготовка, настройки);
    const стол = await выложить(настройки);
    if (стол) this.close();
  }

  static async #запомнить() {
    this.#снять();
    if (!this.н.заготовка) {
      ui.notifications.warn(Т("Впишите имя заготовки."));
      return;
    }
    await запомнить("porjadok", this.н.заготовка, this.настройки());
    this.render();
  }

  static #закрыть() { this.close(); }

  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    const корень = this.element;

    // Размер поля и набор меняют картинку окна — перерисовываем сразу.
    корень.addEventListener("change", event => {
      if (["строк", "столбцов", "набор"].includes(event.target?.name)) {
        this.#снять();
        this.render();
      }
    });

    корень.addEventListener("dragstart", event => {
      const откуда = event.target.closest?.("[data-tjanut]");
      if (!откуда) return;
      event.dataTransfer.setData("text/plain", откуда.dataset.tjanut);
      event.dataTransfer.effectAllowed = "copyMove";
    });
    корень.addEventListener("dragover", event => {
      if (event.target.closest?.(".uo-cherda-pole [data-kletka], .uo-cherda-primanki")) event.preventDefault();
    });
    корень.addEventListener("drop", event => {
      const клетка = event.target.closest?.(".uo-cherda-pole [data-kletka]");
      const приманки = event.target.closest?.(".uo-cherda-primanki");
      if (!клетка && !приманки) return;
      event.preventDefault();
      event.stopPropagation();
      const [откуда, н] = String(event.dataTransfer.getData("text/plain")).split(":");
      this.#снять();
      if (откуда === "набор") {
        const к = наборы.пул()[this.набор]?.картинки?.[Number(н)];
        if (!к) return;
        this.вРуке = { откуда: "набор", к: { путь: к.путь, подпись: к.подпись ?? "" } };
      } else if (откуда === "клетка") this.вРуке = { откуда: "клетка", клетка: Number(н) };
      else if (откуда === "приманка") this.вРуке = { откуда: "приманка", н: Number(н) };
      else return;
      if (клетка) ОкноПодготовки.#клетка.call(this, event, клетка);
      else ОкноПодготовки.#вПриманки.call(this);
    });
  }

  async _renderHTML() {
    const н = this.н;
    const склад = наборы.пул();
    if (this.набор >= склад.length) this.набор = 0;
    const р = this.вРуке;

    const темы = Object.entries(ТЕМЫ).map(([id, имя]) =>
      `<option value="${id}" ${н.тема === id ? "selected" : ""}>${Т(имя)}</option>`).join("");
    const выборНабора = склад.map((с, i) =>
      `<option value="${i}" ${this.набор === i ? "selected" : ""}>${Т("{имя} — картинок {картинки}", { имя: экранировать(с.имя), картинки: с.картинки.length })}</option>`).join("");
    const игроки = game.users.filter(u => !u.isGM).map(u =>
      `<label class="uo-igrok"><input type="checkbox" name="игрок" value="${u.id}" ${н.двигают.includes(u.id) ? "checked" : ""}> ${экранировать(u.name)}</label>`).join("");
    const поимённо = н.двигают.length > 0;

    const картинка = (к, доп = "") => `
      <img src="${экранировать(к.путь)}" alt="" draggable="false">
      ${к.подпись ? `<span class="uo-cherda-podpis">${экранировать(к.подпись)}</span>` : ""}${доп}`;

    const поле = н.поле.map((к, клетка) => {
      const взята = р?.откуда === "клетка" && р.клетка === клетка;
      return `
        <div class="uo-cherda-kletka uo-mozhno ${к?.закреплён ? "uo-zakreplena" : ""} ${взята ? "uo-vzjata" : ""}"
             data-action="клетка" data-kletka="${клетка}" ${к ? `draggable="true" data-tjanut="клетка:${клетка}"` : ""}>
          ${к ? картинка(к, `
            <span class="uo-cherda-knopki">
              <button type="button" data-action="закрепить" data-kletka="${клетка}"
                      title="${к.закреплён ? Т("Закреплена — видна игрокам с начала. Щёлкните, чтобы отдать на выбор.") : Т("На выбор. Щёлкните, чтобы закрепить на месте как подсказку.")}">
                <i class="fa-solid ${к.закреплён ? "fa-lock" : "fa-lock-open"}"></i></button>
              <button type="button" data-action="очистить" data-kletka="${клетка}" title="${Т("убрать")}"><i class="fa-solid fa-xmark"></i></button>
            </span>`) : `<span class="uo-cherda-pusto">${клетка + 1}</span>`}
        </div>`;
    }).join("");

    const приманки = н.приманки.map((к, i) => `
      <figure class="uo-cherda-kusok ${р?.откуда === "приманка" && р.н === i ? "uo-vzjata" : ""}"
              data-action="приманка" data-primanka="${i}" draggable="true" data-tjanut="приманка:${i}">
        ${картинка(к)}
        <button type="button" class="uo-cherda-lupa" data-action="убратьПриманку" data-primanka="${i}" title="${Т("убрать")}"><i class="fa-solid fa-xmark"></i></button>
      </figure>`).join("");

    const палитра = (склад[this.набор]?.картинки ?? []).map((к, i) => {
      const взята = р?.откуда === "набор" && р.к.путь === к.путь && р.к.подпись === (к.подпись ?? "");
      return `
        <figure class="uo-cherda-kusok ${взята ? "uo-vzjata" : ""}" data-action="изНабора" data-kartinka="${i}"
                draggable="true" data-tjanut="набор:${i}" title="${экранировать(к.подпись ?? "")}">
          ${картинка({ путь: к.путь, подпись: к.подпись ?? "" })}
        </figure>`;
    }).join("");

    const наВыбор = н.поле.filter(к => к && !к.закреплён).length;
    const закреплено = н.поле.filter(к => к?.закреплён).length;
    const вРуке = this.#взятое();

    return `
      <div class="uo-forma uo-cherda-podgotovka uo-tema-${экранировать(н.тема)}">
        <div class="uo-cherda-shapka">
          <label>${Т("Название")} <input type="text" name="название" value="${экранировать(н.название)}"></label>
          <label>${Т("Задача")} <input type="text" name="подпись" value="${экранировать(н.подпись)}" placeholder="${Т("«разложите по порядку событий»")}"></label>
          <label>${Т("Оформление")} <select name="тема">${темы}</select></label>
          <label>${Т("Поле")}
            <span class="uo-cherda-razmer">
              <input type="number" name="строк" value="${н.строк}" min="1" max="${СТРОК_НАИБОЛЬШЕ}" step="1" title="${Т("строк")}">
              ×
              <input type="number" name="столбцов" value="${н.столбцов}" min="1" max="${СТОЛБЦОВ_НАИБОЛЬШЕ}" step="1" title="${Т("столбцов")}">
            </span>
          </label>
        </div>

        <p class="uo-podskazka">${Т("Возьмите картинку из набора и щёлкните клетку — или перетащите. Замок на картинке: закреплена, видна игрокам с начала как подсказка. Открытый замок: уходит в выбор под полем. Приманки — лишние картинки в выборе, которым на поле места нет.")}</p>

        <div class="uo-cherda-masterskaja">
          <div class="uo-cherda-levo">
            <div class="uo-cherda-pole" style="--stolbcov: ${н.столбцов}">${поле}</div>
            <p class="uo-podskazka">${Т("На поле: на выбор {наВыбор}, закреплено {закреплено}, приманок {приманок}.", { наВыбор, закреплено, приманок: н.приманки.length })}
              ${вРуке ? ` ${Т("В руке: {что}.", { что: экранировать(вРуке.подпись || вРуке.путь.split("/").pop()) })}` : ""}</p>
            <div class="uo-cherda-zapas uo-cherda-primanki ${вРуке && р.откуда !== "приманка" ? "uo-mozhno" : ""}" data-action="вПриманки">
              <div class="uo-cherda-zagolovok">${Т("Приманки")}
                <span class="uo-podskazka">${Т("— перетащите сюда для добавления в список приманок")}</span></div>
              <div class="uo-cherda-kuski">${приманки || `<p class="uo-podskazka">${Т("Приманок нет.")}</p>`}</div>
            </div>
          </div>

          <div class="uo-cherda-pravo">
            ${склад.length ? `
              <label>${Т("Набор")} <select name="набор">${выборНабора}</select></label>
              <div class="uo-cherda-palitra">${палитра}</div>` : `
              <p class="uo-podskazka">${Т("Наборов картинок пока нет — можно брать свои файлы или завести набор.")}</p>`}
            <div class="uo-cherda-palitra-knopki">
              <button type="button" data-action="свойФайл"><i class="fa-solid fa-folder-open"></i> ${Т("Свой файл…")}</button>
              ${склад.length ? `<button type="button" data-action="строкой"><i class="fa-solid fa-grip-lines"></i> ${Т("Весь набор строкой")}</button>` : ""}
              <button type="button" data-action="наборы"><i class="fa-solid fa-images"></i> ${Т("Наборы картинок")}</button>
              <button type="button" data-action="очиститьПоле"><i class="fa-solid fa-eraser"></i> ${Т("Очистить поле")}</button>
            </div>
          </div>
        </div>

        <div class="uo-cherda-podval">
          <label>${Т("Предел попыток")} <input type="number" name="предел" value="${н.предел}" min="0" step="1"></label>
          <label>${Т("Подсказка после неудачи")}
            <select name="подсказка">
              <option value="нет" ${н.подсказка !== "сколько" ? "selected" : ""}>${Т("никакой")}</option>
              <option value="сколько" ${н.подсказка === "сколько" ? "selected" : ""}>${Т("сколько картинок на своих местах")}</option>
            </select>
          </label>
          <label>${Т("Пустые клетки — глухие")} <input type="checkbox" name="глухие" ${н.глухие ? "checked" : ""}></label>
          <p class="uo-podskazka">${Т("Глухая клетка задаёт форму поля: туда ничего не положить. Без галочки пустая клетка открыта, и верно — оставить её пустой.")}</p>
          <label>${Т("Макрос при разгадке")} <input type="text" name="макрос" value="${экранировать(н.макрос)}" placeholder="${Т("имя макроса, необязательно")}"></label>
          <fieldset>
            <legend>${Т("Кто двигает картинки")}</legend>
            <label class="uo-igrok"><input type="radio" name="кто" value="все" ${поимённо ? "" : "checked"}> ${Т("Все игроки")}</label>
            <label class="uo-igrok"><input type="radio" name="кто" value="отмеченные" ${поимённо ? "checked" : ""}> ${Т("Только отмеченные ниже")}</label>
            ${игроки || `<p class="uo-podskazka">${Т("Игроков в мире нет.")}</p>`}
          </fieldset>
          <label>${Т("Запомнить как заготовку")}
            <input type="text" name="заготовка" value="${экранировать(н.заготовка)}" placeholder="${Т("имя, необязательно")}">
          </label>
        </div>

        <div class="uo-cherda-deistvija">
          <button type="button" data-action="выложить"><i class="fa-solid fa-table-cells"></i> ${Т("Выложить на стол")}</button>
          <button type="button" data-action="запомнить"><i class="fa-solid fa-floppy-disk"></i> ${Т("Запомнить заготовку")}</button>
          <button type="button" data-action="закрыть">${Т("Закрыть")}</button>
        </div>
      </div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }
}

/** Открыть подготовку: с нуля, из заготовки (её «Править») или из старых настроек. */
export function диалогПорядка(заготовка = null, имяЗаготовки = "") {
  if (!game.user.isGM) return null;
  const окно = new ОкноПодготовки({ заготовка, имяЗаготовки });
  окно.render({ force: true });
  return окно;
}

ВИДЫ.set("porjadok", { имя: М("Череда"), ход, выложить, диалог: диалогПорядка, Окно: ОкноПорядка });

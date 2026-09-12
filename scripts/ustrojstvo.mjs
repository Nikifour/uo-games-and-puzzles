/**
 * Устройство и разделённое руководство.
 *
 * Один игрок стоит у механизма и видит рычаги. Остальные держат обрывки
 * руководства — у каждого свой, и чужого не видно. Порядок рычагов выводится
 * только из всех обрывков сразу, поэтому играют голосом: «у меня сказано, что
 * синий раньше треснувшего», «а у меня — что последним всегда кристалл».
 *
 * Это единственная загадка семьи, которую нельзя разложить на настоящем столе:
 * там все листки лежат перед всеми. Здесь обрывок доставляет сервер Foundry
 * поимённо — чужому клиенту его попросту не отправят, и подглядеть через F12
 * нечего. Тот самый личный слой, что обкатан на подменных костях.
 *
 * Склад устройств — в настройках модуля: рычаги, верный порядок и обрывки
 * готовятся заранее, как наборы картинок.
 */

import { Т, М } from "./yazyk.mjs";

import {
  MODULE_ID, ВИДЫ, всеСтолы, столПоId, записать, убрать, тайна, тайнуЗапомнить,
  просить, разослать, собрать, объявить, событие, запуститьМакрос, имяИгрока,
  забытьОкно, спрятать, спрятатьУСебя, личноеПисьмо, ТЕМЫ,
} from "./stol.mjs";
import { полеЗаготовки, запомнитьИзДиалога, заполнить } from "./zagotovki.mjs";

const { ApplicationV2, DialogV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/* ──────────────────────────── склад устройств ──────────────────────────── */

/** [{имя, рычаги: [строки], порядок: [номера], обрывки: [строки]}] */
export const пул = () => {
  const список = game.settings.get(MODULE_ID, "ustrojstva");
  return Array.isArray(список) ? список : [];
};

export async function сохранить(список) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, "ustrojstva", список);
}

export class МенюУстройств extends foundry.applications.api.ApplicationV2 {
  async render() {
    await редактор();
    return this;
  }
}

export async function редактор() {
  if (!game.user.isGM) return;

  const склад = пул();
  const строки = склад.length
    ? `<div class="uo-zagotovki">${склад.map((у, i) => `
        <div class="uo-zagotovka">
          <span>${экранировать(у.имя)} <span class="uo-podskazka">${Т(`— рычагов {рычаги}, обрывков {обрывки}`, { рычаги: 
            у.рычаги?.length ?? 0, обрывки: у.обрывки?.length ?? 0 })}</span></span>
          <button type="button" class="uo-pravit" data-i="${i}">${Т("Править")}</button>
          <button type="button" class="uo-zabyt" data-i="${i}">${Т("Забыть")}</button>
        </div>`).join("")}</div>`
    : `<p class="uo-podskazka">${Т("Устройств пока нет.")}</p>`;

  await DialogV2.wait({
    window: { title: Т("Устройства"), icon: "fa-solid fa-gears" },
    position: { width: 480 },
    content: `
      <div class="uo-forma">
        <p class="uo-podskazka">${Т("Механизм, его верный порядок и обрывки руководства. Обрывки раздаются игрокам поимённо, и каждый видит только свой.")}</p>
        ${строки}
      </div>`,
    buttons: [
      { action: "новое", label: Т("Создать устройство"), default: true, callback: () => правка(-1) },
      { action: "закрыть", label: Т("Закрыть") },
    ],
    render: (event, диалог) => {
      диалог.element.querySelectorAll(".uo-pravit").forEach(к =>
        к.addEventListener("click", () => { диалог.close(); правка(Number(к.dataset.i)); }));
      диалог.element.querySelectorAll(".uo-zabyt").forEach(к =>
        к.addEventListener("click", async () => {
          await сохранить(пул().filter((_, i) => i !== Number(к.dataset.i)));
          диалог.close();
          редактор();
        }));
    },
  });
}

async function правка(индекс) {
  if (!game.user.isGM) return;

  const склад = пул();
  const у = индекс >= 0 ? склад[индекс] : { имя: "", рычаги: [], порядок: [], обрывки: [] };
  if (!у) return;

  const рычаг = (имя = "") => `
    <div class="uo-ryczag-stroka">
      <input type="text" class="uo-ryczag" value="${экранировать(имя)}" placeholder="${Т("как называется рычаг")}">
      <button type="button" class="uo-ubrat-stroku" title="${Т("убрать")}">✕</button>
    </div>`;

  const обрывок = (текст = "") => `
    <div class="uo-obryvok-stroka">
      <textarea class="uo-obryvok" rows="2" placeholder="${Т("что написано в этом куске руководства")}">${экранировать(текст)}</textarea>
      <button type="button" class="uo-ubrat-stroku" title="${Т("убрать")}">✕</button>
    </div>`;

  await DialogV2.wait({
    window: { title: индекс >= 0 ? `Устройство «${у.имя}»` : Т("Новое устройство"), icon: "fa-solid fa-gears" },
    position: { width: 620 },
    content: `
      <div class="uo-forma">
        <label>${Т("Название")} <input type="text" name="имя" value="${экранировать(у.имя)}"></label>

        <h3>${Т("Рычаги")}</h3>
        <p class="uo-podskazka">${Т("Их видит тот, кто стоит у механизма. Порядок в этом списке — просто порядок кнопок на панели, а не разгадка.")}</p>
        <div class="uo-ryczagi">${(у.рычаги?.length ? у.рычаги : ["", ""]).map(рычаг).join("")}</div>
        <button type="button" class="uo-dobavit-ryczag">${Т("Добавить рычаг")}</button>

        <label>${Т("Верный порядок")} <input type="text" name="порядок" value="${экранировать((у.порядок ?? []).map(н => н + 1).join(" "))}" placeholder="2 4 1 3"></label>
        <p class="uo-podskazka">${Т("Номерами рычагов сверху, через пробел. Можно короче, чем рычагов: «2 4» значит «дёрнуть второй, потом четвёртый».")}</p>

        <h3>${Т("Обрывки руководства")}</h3>
        <p class="uo-podskazka">${Т("По куску на игрока. Порядок должен выводиться из всех обрывков вместе и ни из одного по отдельности — в этом вся соль.")}</p>
        <div class="uo-obryvki">${(у.обрывки?.length ? у.обрывки : [""]).map(обрывок).join("")}</div>
        <button type="button" class="uo-dobavit-obryvok">${Т("Добавить обрывок")}</button>
      </div>`,
    buttons: [
      {
        action: "сохранить", label: Т("Сохранить"), default: true,
        callback: async (event, кнопка, диалог) => {
          const э = диалог.element;
          const имя = э.querySelector(`[name="имя"]`).value.trim();
          const рычаги = [...э.querySelectorAll(".uo-ryczag")].map(п => п.value.trim()).filter(Boolean);
          const обрывки = [...э.querySelectorAll(".uo-obryvok")].map(п => п.value.trim()).filter(Boolean);
          const порядок = э.querySelector(`[name="порядок"]`).value
            .split(/[\s,]+/).filter(Boolean).map(н => Number(н) - 1);

          if (!имя) return void ui.notifications.warn(Т("У устройства должно быть название"));
          if (рычаги.length < 2) return void ui.notifications.warn(Т("Нужно хотя бы два рычага"));
          if (!порядок.length || порядок.some(н => !Number.isInteger(н) || н < 0 || н >= рычаги.length)) {
            return void ui.notifications.warn(Т("Верный порядок — номера рычагов из списка выше"));
          }
          if (!обрывки.length) return void ui.notifications.warn(Т("Нужен хотя бы один обрывок руководства"));

          const все = пул();
          const запись = { имя, рычаги, порядок, обрывки };
          if (индекс >= 0) все[индекс] = запись; else все.push(запись);
          await сохранить(все);
          ui.notifications.info(`Устройство «${имя}»: рычагов ${рычаги.length}, обрывков ${обрывки.length}`);
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => {
      const корень = диалог.element;
      const повесить = с => с.querySelector(".uo-ubrat-stroku").addEventListener("click", () => с.remove());
      корень.querySelectorAll(".uo-ryczag-stroka, .uo-obryvok-stroka").forEach(повесить);

      const добавить = (кнопка, гнездо, разметка, куда) =>
        корень.querySelector(кнопка).addEventListener("click", () => {
          const болванка = document.createElement("div");
          болванка.innerHTML = разметка();
          const новая = болванка.firstElementChild;
          корень.querySelector(гнездо).appendChild(новая);
          повесить(новая);
          новая.querySelector(куда).focus();
        });

      добавить(".uo-dobavit-ryczag", ".uo-ryczagi", рычаг, ".uo-ryczag");
      добавить(".uo-dobavit-obryvok", ".uo-obryvki", обрывок, ".uo-obryvok");
    },
  });
}

/* ─────────────────────────── выложить на стол ─────────────────────────── */

export async function выложить(конфиг = {}) {
  if (!game.user.isGM) return null;

  const устройство = конфиг.устройство ?? пул()[Number(конфиг.склад)];
  if (!устройство?.рычаги?.length) {
    ui.notifications.error(Т("Нужно устройство со склада."));
    return null;
  }

  const участники = (конфиг.участники ?? []).filter(Boolean);
  if (!участники.length) { ui.notifications.error(Т("Некому раздать обрывки.")); return null; }

  const оператор = конфиг.оператор && участники.includes(конфиг.оператор) ? конфиг.оператор : участники[0];

  // Обрывки раздаём по кругу: обрывков может быть больше или меньше, чем рук.
  const кому = {};
  участники.forEach((кто, i) => { кому[кто] = []; });
  устройство.обрывки.forEach((текст, i) => {
    const кто = участники[i % участники.length];
    кому[кто].push(текст);
  });

  await прибрать();

  const id = foundry.utils.randomID();
  const стол = {
    id,
    тип: "ustrojstvo",
    название: конфиг.название?.trim() || устройство.имя || Т("Устройство"),
    подпись: конфиг.подпись?.trim() || "",
    тема: (конфиг.тема in ТЕМЫ) ? конфиг.тема : "kamen",
    рычаги: устройство.рычаги.map(имя => ({ имя })),
    нажато: [],
    оператор,
    участники,
    сбросПриОшибке: конфиг.сбросПриОшибке !== false,
    попытки: { сделано: 0, предел: Math.max(0, Number(конфиг.предел) || 0) },
    журнал: [],
    решено: false,
    заклинило: false,
    завершён: false,
    показан: true,
    макрос: конфиг.макрос?.trim() || null,
  };

  await тайнуЗапомнить(id, {
    порядок: устройство.порядок,
    обрывки: Object.fromEntries(Object.entries(кому).map(([кто, куски]) => [кто, куски.join("\n\n")])),
  });
  await записать(стол);
  разослатьОбрывки(id);
  return стол;
}

export async function прибрать() {
  for (const [id, с] of Object.entries(всеСтолы())) {
    if (с.тип === "ustrojstvo" && с.завершён) await убрать(id);
  }
}

/** Разослать каждому его кусок руководства. Чужому сервер его не отдаст. */
export function разослатьОбрывки(id) {
  if (!game.user.isGM) return;
  const обрывки = тайна(id)?.обрывки ?? {};
  for (const [кто, текст] of Object.entries(обрывки)) {
    личноеПисьмо(кто, "ustrojstvo", { что: "обрывок", id, текст });
  }
}

/* ─────────────────────────────── правила ─────────────────────────────── */

const уМеханизма = (стол, пользователь) =>
  !!пользователь && !стол.решено && !стол.заклинило &&
  (пользователь.isGM || стол.оператор === пользователь.id);

const осталосьПопыток = стол =>
  стол.попытки?.предел ? стол.попытки.предел - стол.попытки.сделано : Infinity;

/* — что знает наш клиент про свой обрывок — */

const ОБРЫВКИ = new Map();
const спрошено = new Set();

function личное(что) {
  if (что?.что !== "обрывок") return;
  ОБРЫВКИ.set(что.id, что.текст ?? "");
}

export const мойОбрывок = id => ОБРЫВКИ.get(id) ?? null;

async function ход(стол, запрос) {
  const пользователь = game.users.get(запрос.кто);
  if (!пользователь) return;

  // Переспросить свой обрывок можно всегда: страницу перезагрузили — и он пропал.
  if (запрос.что === "мойОбрывок") {
    const текст = тайна(стол.id)?.обрывки?.[пользователь.id];
    if (текст !== undefined) личноеПисьмо(пользователь.id, "ustrojstvo", { что: "обрывок", id: стол.id, текст });
    return;
  }

  if (!уМеханизма(стол, пользователь)) return;
  if (запрос.что !== "дёрнуть") return;
  if (осталосьПопыток(стол) <= 0) return;

  const рычаг = Number(запрос.рычаг);
  if (!Number.isInteger(рычаг) || рычаг < 0 || рычаг >= стол.рычаги.length) return;

  const порядок = тайна(стол.id)?.порядок;
  if (!порядок) {
    ui.notifications.error(
      `Верный порядок для «${стол.название}» не найден в этом браузере. Засчитайте вручную или выложите заново.`);
    return;
  }

  const нажато = [...стол.нажато, рычаг];
  const шагВерен = порядок[нажато.length - 1] === рычаг;

  if (шагВерен && нажато.length === порядок.length) return открылось(стол, нажато, запрос.кто);

  if (шагВерен) {
    разослать(стол.id, { нажато });
    return;
  }

  // Ошиблись. Либо механизм щёлкает и сбрасывается, либо ждёт до конца.
  if (!стол.сбросПриОшибке) {
    if (нажато.length < порядок.length) { разослать(стол.id, { нажато }); return; }
    return промах(стол, нажато, запрос.кто);
  }
  return промах(стол, нажато, запрос.кто);
}

async function промах(стол, нажато, ктоId) {
  const обновлённый = {
    ...столПоId(стол.id),
    нажато: [],
    попытки: { ...стол.попытки, сделано: стол.попытки.сделано + 1 },
    журнал: [...(стол.журнал ?? []), {
      кто: имяИгрока(ктоId),
      набор: нажато.map(р => стол.рычаги[р]?.имя ?? "?").join(" → "),
    }].slice(-8),
  };

  if (обновлённый.попытки.предел && обновлённый.попытки.сделано >= обновлённый.попытки.предел) {
    обновлённый.заклинило = true;
    обновлённый.завершён = true;
  }

  await записать(обновлённый);
  await объявить(
    обновлённый.заклинило
      ? `<p><strong>${экранировать(стол.название)}</strong> ${Т("— механизм заклинило.")}</p>`
      : `<p><strong>${экранировать(стол.название)}</strong> ${Т("— щелчок, и рычаги встают обратно.")}</p>`,
    стол.название);
}

async function открылось(стол, нажато, ктоId) {
  const свежий = { ...столПоId(стол.id), нажато, решено: true, завершён: true };
  await записать(свежий);
  await объявить(
    Т(`<p><strong>{название}</strong> — механизм поддался.</p>
     <p>{имя}</p>
     <p><em>У механизма стоял {ктоId}.</em></p>`, { название: экранировать(свежий.название), имя: экранировать(нажато.map(р => свежий.рычаги[р]?.имя ?? "?").join(" → ")), ктоId: экранировать(имяИгрока(ктоId)) }),
    свежий.название);
  событие("решено", свежий);
  await запуститьМакрос(свежий.макрос, свежий);
}

/* ─────────────────── рычаги ведущего (нажимает он сам) ─────────────────── */

export async function засчитать(id) {
  const стол = столПоId(id);
  if (!стол) return;
  const порядок = тайна(id)?.порядок ?? [];
  const полный = { ...собрать(стол), нажато: порядок, решено: true, заклинило: false, завершён: true };
  await записать(полный);
  await объявить(Т(`<p><strong>{название}</strong> — открыт волей ведущего.</p>`, { название: экранировать(полный.название) }), полный.название);
  событие("решено", полный);
  await запуститьМакрос(полный.макрос, полный);
}

export async function сбросить(id) {
  const стол = столПоId(id);
  if (!стол) return;
  await записать({
    ...стол,
    нажато: [],
    попытки: { ...стол.попытки, сделано: 0 },
    журнал: [],
    решено: false,
    заклинило: false,
    завершён: false,
  });
}

/* ──────────────────────────────── окно ──────────────────────────────── */

class ОкноУстройства extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.стол = options.стол;
    this.всёВидно = false;
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-ustrojstvo-okno"],
    tag: "div",
    window: { title: Т("Устройство"), icon: "fa-solid fa-gears", resizable: false },
    position: { width: 520, height: "auto" },
    actions: {
      дёрнуть: ОкноУстройства.#дёрнуть,
      всёВидно: ОкноУстройства.#всёВидно,
      переслать: ОкноУстройства.#переслать,
      засчитать: ОкноУстройства.#засчитать,
      сброс: ОкноУстройства.#сброс,
      снять: ОкноУстройства.#снять,
    },
  };

  get title() { return this.стол?.название ?? Т("Устройство"); }

  static #дёрнуть(event, target) {
    просить({ id: this.стол.id, что: "дёрнуть", рычаг: target.dataset.ryczag });
  }

  static #всёВидно() { this.всёВидно = !this.всёВидно; this.render(); }
  static #переслать() { разослатьОбрывки(this.стол.id); ui.notifications.info(Т("Обрывки разосланы заново")); }
  static #засчитать() { засчитать(this.стол.id); }
  static #сброс() { сбросить(this.стол.id); }
  static #снять() { убрать(this.стол.id); }

  _onClose() {
    забытьОкно(this.стол.id);
    if (this.закрываемСами) return;
    if (game.user.isGM) спрятать(this.стол.id);
    else спрятатьУСебя(this.стол.id);
  }

  async _renderHTML() {
    const с = this.стол;
    const дёргает = уМеханизма(с, game.user);
    const яУчаствую = (с.участники ?? []).includes(game.user.id);

    // Обрывок мог пропасть при перезагрузке страницы — переспросим один раз.
    if (яУчаствую && !ОБРЫВКИ.has(с.id) && !спрошено.has(с.id)) {
      спрошено.add(с.id);
      просить({ id: с.id, что: "мойОбрывок" });
    }

    const рычаги = с.рычаги.map((р, i) => `
      <button type="button" class="uo-ryczag-knopka" ${дёргает ? `data-action="дёрнуть" data-ryczag="${i}"` : "disabled"}>
        <span class="uo-nomer">${i + 1}</span>${экранировать(р.имя)}
      </button>`).join("");

    const набрано = с.нажато.length
      ? `<p class="uo-nabrano">${экранировать(с.нажато.map(р => с.рычаги[р]?.имя ?? "?").join(" → "))}</p>`
      : `<p class="uo-podskazka">${Т("Рычаги стоят как стояли.")}</p>`;

    const обрывок = мойОбрывок(с.id);
    const личное = яУчаствую
      ? `<section class="uo-obryvok-moj">
           <h4>${Т("Ваш обрывок руководства")}</h4>
           ${обрывок
             ? `<p>${экранировать(обрывок).replace(/\n/g, "<br>")}</p>`
             : `<p class="uo-podskazka">${Т("Обрывок в пути… Если не появился, попросите ведущего переслать.")}</p>`}
         </section>`
      : `<p class="uo-podskazka">${Т("Вы смотрите со стороны: обрывка вам не досталось.")}</p>`;

    const ктоУМеханизма = имяИгрока(с.оператор);
    const счёт = с.попытки?.предел
      ? `Попытка ${Math.min(с.попытки.сделано + 1, с.попытки.предел)} из ${с.попытки.предел}`
      : `Промахов: ${с.попытки?.сделано ?? 0}`;

    const журнал = (с.журнал ?? []).length ? `
      <ol class="uo-zhurnal">
        ${[...с.журнал].reverse().map(з => `
          <li><span class="uo-kto">${экранировать(з.кто)}</span>
              <span class="uo-podskazka">${экранировать(з.набор)}</span></li>`).join("")}
      </ol>` : "";

    const итог = с.решено
      ? `<p class="uo-itog uo-otkryt">${Т("Механизм поддался.")}</p>`
      : с.заклинило
        ? `<p class="uo-itog uo-zaklinilo">${Т("Механизм заклинило. Ведущий может дать ещё попытку.")}</p>`
        : "";

    const тайное = тайна(с.id);
    const гм = game.user.isGM ? `
      <section class="uo-gm">
        <div class="uo-gm-kod">
          <button type="button" data-action="всёВидно">${this.всёВидно ? "Скрыть" : Т("Показать порядок и обрывки")}</button>
        </div>
        ${this.всёВидно && тайное ? `
          <div class="uo-gm-tajna">
            <p><strong>${Т("Порядок:")}</strong> ${экранировать((тайное.порядок ?? [])
              .map(р => с.рычаги[р]?.имя ?? ")?").join(" → "))}</p>
            ${Object.entries(тайное.обрывки ?? {}).map(([кто, текст]) =>
              `<p><strong>${экранировать(имяИгрока(кто))}:</strong> ${экранировать(текст)}</p>`).join("")}
          </div>` : ""}
        <div class="uo-gm-knopki">
          <button type="button" data-action="переслать">${Т("Переслать обрывки")}</button>
          <button type="button" data-action="засчитать">${Т("Засчитать")}</button>
          <button type="button" data-action="сброс">${Т("Сбросить")}</button>
          <button type="button" data-action="снять">${Т("Убрать со стола")}</button>
        </div>
      </section>` : "";

    return `
      <div class="uo-ustrojstvo-telo uo-tema-${экранировать(с.тема)}">
        ${с.подпись ? `<p class="uo-podpis">${экранировать(с.подпись)}</p>` : ""}
        <p class="uo-podskazka">${Т("У механизма:")} <strong>${экранировать(ктоУМеханизма)}</strong>${
          дёргает ? Т(") — это вы") : ""}.</p>
        <div class="uo-ryczagi-panel">${рычаги}</div>
        ${набрано}
        <div class="uo-stroka"><span class="uo-schet">${счёт}</span></div>
        ${итог}
        ${личное}
        ${журнал}
        ${гм}
      </div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }
}

/* ──────────────────────────── диалог создания ──────────────────────────── */

export async function диалогУстройства(заготовка = null, имяЗаготовки = "") {
  if (!game.user.isGM) return null;

  const склад = пул();
  if (!склад.length) {
    ui.notifications.warn(
      Т("Сперва заведите устройство: Настройки → Настройки модулей → UO · Игры и загадки → Устройства."));
    return null;
  }

  const темы = Object.entries(ТЕМЫ).map(([id, имя]) => `<option value="${id}">${имя}</option>`).join("");
  const устройства = склад.map((у, i) =>
    `<option value="${i}">${Т(`{имя} — рычагов {рычаги}, обрывков {обрывки}`, { имя: экранировать(у.имя), рычаги: у.рычаги.length, обрывки: у.обрывки.length })}</option>`).join("");
  const игроки = game.users.filter(u => !u.isGM).map(u =>
    `<label class="uo-igrok"><input type="checkbox" name="участник" value="${u.id}" checked> ${экранировать(u.name)}</label>`).join("");
  const операторы = game.users.filter(u => !u.isGM).map(u =>
    `<option value="${u.id}">${экранировать(u.name)}</option>`).join("");

  return DialogV2.wait({
    window: { title: Т("Новое устройство на стол"), icon: "fa-solid fa-gears" },
    position: { width: 500 },
    content: `
      <div class="uo-forma">
        <label>${Т("Название")} <input type="text" name="название" placeholder="${Т("возьмётся от устройства")}"></label>
        <label>${Т("Задача")} <input type="text" name="подпись" placeholder="${Т("«механизм врат, руководство разорвано»")}"></label>
        <label>${Т("Устройство")} <select name="склад">${устройства}</select></label>
        <label>${Т("У механизма стоит")} <select name="оператор">${операторы}</select></label>
        <p class="uo-podskazka">${Т("Он один дёргает рычаги. Остальные видят панель, но нажать не могут — зато у каждого свой обрывок руководства.")}</p>
        <label>${Т("Ошибка сбрасывает рычаги")} <input type="checkbox" name="сброс" checked></label>
        <label>${Т("Предел промахов")} <input type="number" name="предел" value="0" min="0" step="1"></label>
        <label>${Т("Оформление")} <select name="тема">${темы}</select></label>
        <label>${Т("Макрос при разгадке")} <input type="text" name="макрос" placeholder="${Т("необязательно")}"></label>
        <fieldset>
          <legend>${Т("Кому раздать обрывки")}</legend>
          ${игроки || `<p class="uo-podskazka">${Т("Игроков в мире нет.")}</p>`}
          <p class="uo-podskazka">${Т("Обрывки раздаются по кругу: если их больше, чем рук, кому-то достанется два.")}</p>
        </fieldset>
        ${полеЗаготовки(имяЗаготовки)}
      </div>`,
    buttons: [
      {
        action: "выложить", label: Т("Выложить на стол"), default: true,
        callback: async (event, кнопка, диалог) => {
          const э = диалог.element;
          const зн = имя => э.querySelector(`[name="${имя}"]`)?.value?.trim() ?? "";
          const участники = [...э.querySelectorAll(`[name="участник"]:checked`)].map(и => и.value);

          return выложить(await запомнитьИзДиалога("ustrojstvo", э, {
            название: зн("название"), подпись: зн("подпись"), склад: зн("склад"),
            оператор: зн("оператор"), участники, тема: зн("тема"), предел: зн("предел"),
            сбросПриОшибке: !!э.querySelector(`[name="сброс"]`)?.checked, макрос: зн("макрос"),
          }));
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => заполнить(диалог.element, заготовка),
  });
}

ВИДЫ.set("ustrojstvo", { имя: М("Устройство"), ход, выложить, диалог: диалогУстройства, Окно: ОкноУстройства, личное });

/**
 * Карта путей — проложить дорогу через порталы.
 *
 * Узлы это миры, рёбра — порталы между ними. Часть порталов односторонние:
 * туда ведёт, обратно нет — этим карта и отличается от простой дороги.
 * Дважды в один мир не заходят. Пройти нужно через все отмеченные миры
 * и выйти в цель.
 *
 * Тайны у этой загадки нет: карта на то и карта, чтобы её видели. Играют
 * не в угадайку, а в планирование — и потому тупик здесь честен, он виден
 * заранее тому, кто смотрел вперёд.
 */

import { Т, М } from "./yazyk.mjs";

import {
  ВИДЫ, всеСтолы, столПоId, записать, убрать, просить, разослать, собрать,
  объявить, событие, запуститьМакрос, имяИгрока, забытьОкно, спрятать, спрятатьУСебя, ТЕМЫ,
} from "./stol.mjs";
import { полеЗаготовки, запомнитьИзДиалога, заполнить } from "./zagotovki.mjs";

const { ApplicationV2, DialogV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/** Строки «А - Б» (в обе стороны) и «А > Б» (только туда). */
export function разобратьРёбра(текст, узлы) {
  const имена = узлы.map(у => у.toLowerCase());
  const рёбра = [];
  const беда = [];

  for (const строка of String(текст ?? "").split(/\r?\n/)) {
    const голая = строка.trim();
    if (!голая) continue;
    const односторонний = голая.includes(">");
    const части = голая.split(/\s*[->—–]\s*/).map(ч => ч.trim()).filter(Boolean);
    if (части.length !== 2) { беда.push(голая); continue; }
    const [из, в] = части.map(ч => имена.indexOf(ч.toLowerCase()));
    if (из < 0 || в < 0 || из === в) { беда.push(голая); continue; }
    рёбра.push({ из, в, односторонний });
  }
  return { рёбра, беда };
}

const найти = (узлы, имя) => узлы.map(у => у.toLowerCase()).indexOf(String(имя ?? "").trim().toLowerCase());

/* ─────────────────────────── выложить на стол ─────────────────────────── */

export async function выложить(конфиг = {}) {
  if (!game.user.isGM) return null;

  const узлы = String(конфиг.узлы ?? "").split(/\r?\n/).map(с => с.trim()).filter(Boolean);
  if (узлы.length < 3) { ui.notifications.error(Т("Нужно хотя бы три мира.")); return null; }

  const { рёбра, беда } = разобратьРёбра(конфиг.рёбра, узлы);
  if (беда.length) {
    ui.notifications.error(Т("Не разобрал переходы: {строки}. Пишите «Мир - Мир» или «Мир > Мир».", { строки: беда.slice(0, 3).join("; ") }));
    return null;
  }
  if (!рёбра.length) { ui.notifications.error(Т("Нужен хотя бы один портал.")); return null; }

  const начало = найти(узлы, конфиг.начало);
  const цель = найти(узлы, конфиг.цель);
  if (начало < 0 || цель < 0) { ui.notifications.error(Т("Начало и цель должны быть из списка миров.")); return null; }
  if (начало === цель) { ui.notifications.error(Т("Начало и цель — разные миры.")); return null; }

  const обязательные = String(конфиг.обязательные ?? "").split(/\r?\n/)
    .map(с => найти(узлы, с)).filter(и => и >= 0 && и !== начало && и !== цель);

  await прибрать();

  const стол = {
    id: foundry.utils.randomID(),
    тип: "puti",
    название: конфиг.название?.trim() || Т("Карта путей"),
    подпись: конфиг.подпись?.trim() || "",
    тема: (конфиг.тема in ТЕМЫ) ? конфиг.тема : "orden",
    узлы,
    рёбра,
    начало,
    цель,
    обязательные: [...new Set(обязательные)],
    путь: [начало],
    попытки: { сделано: 0, предел: Math.max(0, Number(конфиг.предел) || 0) },
    идут: конфиг.идут?.length ? конфиг.идут : "все",
    макрос: конфиг.макрос?.trim() || null,
    макросТупика: конфиг.макросТупика?.trim() || null,
    журнал: [],
    пройден: false,
    заклинило: false,
    завершён: false,
    показан: true,
  };

  await записать(стол);
  return стол;
}

export async function прибрать() {
  for (const [id, с] of Object.entries(всеСтолы())) {
    if (с.тип === "puti" && с.завершён) await убрать(id);
  }
}

/* ─────────────────────────────── правила ─────────────────────────────── */

const можетИдти = (стол, пользователь) =>
  !!пользователь && !стол.пройден && !стол.заклинило &&
  (пользователь.isGM || стол.идут === "все" || (стол.идут ?? []).includes(пользователь.id));

/** Куда можно шагнуть отсюда: по ребру и только в тот мир, где ещё не были. */
export function доступные(стол) {
  const где = стол.путь[стол.путь.length - 1];
  const кандидаты = new Set();
  for (const р of стол.рёбра) {
    if (р.из === где) кандидаты.add(р.в);
    if (!р.односторонний && р.в === где) кандидаты.add(р.из);
  }
  return [...кандидаты].filter(у => !стол.путь.includes(у));
}

const всёСобрано = стол => стол.обязательные.every(у => стол.путь.includes(у));

async function ход(стол, запрос) {
  const пользователь = game.users.get(запрос.кто);
  if (!можетИдти(стол, пользователь)) return;

  if (запрос.что === "назад") {
    if (стол.путь.length < 2) return;
    разослать(стол.id, { путь: стол.путь.slice(0, -1) });
    await записать({ ...столПоId(стол.id), путь: стол.путь.slice(0, -1) });
    return;
  }

  if (запрос.что !== "шагнуть") return;

  const куда = Number(запрос.узел);
  if (!доступные(стол).includes(куда)) return;

  const путь = [...стол.путь, куда];

  if (куда === стол.цель) {
    if (всёСобрано({ ...стол, путь })) return дошли(стол, путь, запрос.кто);
    return тупик(стол, путь, запрос.кто, М("вышли в цель, не собрав отмеченного"));
  }

  const дальше = доступные({ ...стол, путь });
  if (!дальше.length) return тупик(стол, путь, запрос.кто, М("дальше дороги нет"));

  разослать(стол.id, { путь });
  await записать({ ...столПоId(стол.id), путь });
}

async function тупик(стол, путь, ктоId, почему) {
  const обновлённый = {
    ...столПоId(стол.id),
    путь: [стол.начало],
    попытки: { ...стол.попытки, сделано: стол.попытки.сделано + 1 },
    журнал: [...(стол.журнал ?? []), {
      кто: имяИгрока(ктоId),
      путь: путь.map(у => стол.узлы[у]).join(" → "),
      почему,
    }].slice(-6),
  };

  if (обновлённый.попытки.предел && обновлённый.попытки.сделано >= обновлённый.попытки.предел) {
    обновлённый.заклинило = true;
    обновлённый.завершён = true;
  }

  await записать(обновлённый);
  await объявить(
    Т(`<p><strong>{название}</strong>: {почему}. Возвращаются к началу.</p>`, { название: экранировать(стол.название), почему: экранировать(Т(почему)) }) +
    (обновлённый.заклинило ? `<p>${Т("Порталы гаснут.")}</p>` : ""), стол.название);
  событие("тупик", обновлённый);
  await запуститьМакрос(стол.макросТупика, обновлённый);
}

async function дошли(стол, путь, ктоId) {
  const свежий = { ...столПоId(стол.id), путь, пройден: true, завершён: true };
  await записать(свежий);
  await объявить(
    Т(`<p><strong>{название}</strong> — дорога сложилась.</p>
     <p>{узлы}</p>
     <p><em>Последний шаг сделал {ктоId}.</em></p>`, { название: экранировать(свежий.название), узлы: экранировать(путь.map(у => свежий.узлы[у]).join(" → ")), ктоId: экранировать(имяИгрока(ктоId)) }), свежий.название);
  событие("решено", свежий);
  await запуститьМакрос(свежий.макрос, свежий);
}

/* ─────────────────── рычаги ведущего ─────────────────── */

export async function засчитать(id) {
  const стол = столПоId(id);
  if (!стол) return;
  const полный = { ...собрать(стол), пройден: true, заклинило: false, завершён: true };
  await записать(полный);
  await объявить(Т(`<p><strong>{название}</strong> — пройдена волей ведущего.</p>`, { название: экранировать(полный.название) }), полный.название);
  событие("решено", полный);
  await запуститьМакрос(полный.макрос, полный);
}

export async function сбросить(id) {
  const стол = столПоId(id);
  if (!стол) return;
  await записать({
    ...стол,
    путь: [стол.начало],
    попытки: { ...стол.попытки, сделано: 0 },
    журнал: [],
    пройден: false,
    заклинило: false,
    завершён: false,
  });
}

/* ──────────────────────────────── окно ──────────────────────────────── */

export function положения(сколько) {
  return Array.from({ length: сколько }, (_, i) => {
    const угол = (i / сколько) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + 40 * Math.cos(угол), y: 50 + 40 * Math.sin(угол) };
  });
}

class ОкноПутей extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.стол = options.стол;
  }

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-puti-okno"],
    tag: "div",
    window: { title: М("Карта путей"), icon: "fa-solid fa-route", resizable: false },
    position: { width: 540, height: "auto" },
    actions: {
      шагнуть: ОкноПутей.#шагнуть,
      назад: ОкноПутей.#назад,
      засчитать: ОкноПутей.#засчитать,
      сброс: ОкноПутей.#сброс,
      снять: ОкноПутей.#снять,
    },
  };

  get title() { return this.стол?.название ?? Т("Карта путей"); }

  static #шагнуть(event, target) {
    просить({ id: this.стол.id, что: "шагнуть", узел: target.dataset.uzel });
  }

  static #назад() { просить({ id: this.стол.id, что: "назад" }); }
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
    const идёт = можетИдти(с, game.user);
    const можно = идёт ? доступные(с) : [];
    const точки = положения(с.узлы.length);
    const где = с.путь[с.путь.length - 1];

    const рёбра = с.рёбра.map(р => {
      const [a, b] = [точки[р.из], точки[р.в]];
      const пройдено = с.путь.some((у, i) =>
        i > 0 && ((с.путь[i - 1] === р.из && у === р.в) || (!р.односторонний && с.путь[i - 1] === р.в && у === р.из)));
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
        class="uo-portal ${р.односторонний ? "uo-odnostoronnij" : ""} ${пройдено ? "uo-projden" : ""}"
        marker-end="${р.односторонний ? "url(#uo-strelka)" : ""}"/>`;
    }).join("");

    const кружки = точки.map((т, i) => {
      const классы = [
        "uo-uzel",
        i === с.начало ? "uo-nachalo" : "",
        i === с.цель ? "uo-cel" : "",
        с.обязательные.includes(i) ? "uo-nuzhen" : "",
        с.путь.includes(i) ? "uo-projden" : "",
        i === где ? "uo-tut" : "",
      ].filter(Boolean).join(" ");
      return `<circle cx="${т.x}" cy="${т.y}" r="3.2" class="${классы}"/>`;
    }).join("");

    const карта = `
      <svg class="uo-karta" viewBox="0 0 100 100" role="img">
        <defs>
          <marker id="uo-strelka" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" class="uo-nakonechnik"/>
          </marker>
        </defs>
        ${рёбра}${кружки}
      </svg>`;

    const узлы = с.узлы.map((имя, i) => {
      const пометки = [
        i === с.начало ? Т("начало") : "",
        i === с.цель ? Т("цель") : "",
        с.обязательные.includes(i) ? Т("нужен") : "",
      ].filter(Boolean).join(", ");
      const доступен = можно.includes(i);
      return `
        <button type="button" class="uo-uzel-knopka ${с.путь.includes(i) ? "uo-projden" : ""} ${
          доступен ? "uo-mozhno" : ""}" ${доступен ? `data-action="шагнуть" data-uzel="${i}"` : "disabled"}>
          ${экранировать(имя)}${пометки ? ` <span class="uo-podskazka">(${пометки})</span>` : ""}
        </button>`;
    }).join("");

    const счёт = с.попытки.предел
      ? Т("Заход {номер} из {предел}", { номер: Math.min(с.попытки.сделано + 1, с.попытки.предел), предел: с.попытки.предел })
      : Т("Тупиков: {сделано}", { сделано: с.попытки.сделано });

    const журнал = (с.журнал ?? []).length ? `
      <ol class="uo-zhurnal">
        ${[...с.журнал].reverse().map(з => `
          <li><span class="uo-kto">${экранировать(з.кто)}</span>
              <span class="uo-podskazka">${экранировать(з.путь)} — ${экранировать(Т(з.почему))}</span></li>`).join("")}
      </ol>` : "";

    const итог = с.пройден
      ? `<p class="uo-itog uo-otkryt">${Т("Дорога сложилась.")}</p>`
      : с.заклинило
        ? `<p class="uo-itog uo-zaklinilo">${Т("Порталы погасли. Ведущий может зажечь их снова.")}</p>`
        : "";

    const гм = game.user.isGM ? `
      <section class="uo-gm">
        <div class="uo-gm-knopki">
          <button type="button" data-action="засчитать">${Т("Засчитать")}</button>
          <button type="button" data-action="сброс">${Т("К началу")}</button>
          <button type="button" data-action="снять">${Т("Убрать со стола")}</button>
        </div>
      </section>` : "";

    return `
      <div class="uo-puti-telo uo-tema-${экранировать(с.тема)}">
        ${с.подпись ? `<p class="uo-podpis">${экранировать(с.подпись)}</p>` : ""}
        ${карта}
        <p class="uo-put-stroka">${экранировать(с.путь.map(у => с.узлы[у]).join(" → "))}</p>
        <div class="uo-uzly">${узлы}</div>
        <div class="uo-stroka">
          <span class="uo-schet">${счёт}</span>
          ${идёт && с.путь.length > 1
            ? `<button type="button" class="uo-pravila-knopka" data-action="назад">${Т("Шаг назад")}</button>` : ""}
        </div>
        ${итог}
        ${журнал}
        ${гм}
      </div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }
}

/* ──────────────────────────── диалог создания ──────────────────────────── */

export async function диалогПутей(заготовка = null, имяЗаготовки = "") {
  if (!game.user.isGM) return null;

  const темы = Object.entries(ТЕМЫ).map(([id, имя]) => `<option value="${id}">${Т(имя)}</option>`).join("");
  const игроки = game.users.filter(u => !u.isGM).map(u =>
    `<label class="uo-igrok"><input type="checkbox" name="игрок" value="${u.id}"> ${экранировать(u.name)}</label>`).join("");

  return DialogV2.wait({
    window: { title: Т("Новая карта путей"), icon: "fa-solid fa-route" },
    position: { width: 560 },
    content: `
      <div class="uo-forma">
        <label>${Т("Название")} <input type="text" name="название" value="${Т("Карта путей")}"></label>
        <label>${Т("Задача")} <input type="text" name="подпись" placeholder="${Т("«дойти до Южной гавани, забрав людей из двух миров»")}"></label>

        <h3>${Т("Миры")}</h3>
        <p class="uo-podskazka">${Т("По одному в строке.")}</p>
        <textarea name="узлы" rows="5" placeholder="${Т(`Северный край
Лесной мир
Пустоши
Ледяной мир
Остров
Южная гавань`)}"></textarea>

        <h3>${Т("Порталы")}</h3>
        <p class="uo-podskazka">${Т("«Мир - Мир» ходит в обе стороны, «Мир &gt; Мир» — только туда. Односторонние и делают карту загадкой.")}</p>
        <textarea name="рёбра" rows="5" placeholder="${Т(`Северный край - Лесной мир
Лесной мир &gt; Пустоши
Пустоши - Ледяной мир
Ледяной мир &gt; Остров
Остров - Южная гавань`)}"></textarea>

        <label>${Т("Начало")} <input type="text" name="начало" placeholder="${Т("Северный край")}"></label>
        <label>${Т("Цель")} <input type="text" name="цель" placeholder="${Т("Южная гавань")}"></label>
        <label>${Т("Обязательные миры")} <textarea name="обязательные" rows="2" placeholder="${Т("по одному в строке, можно пусто")}"></textarea></label>
        <label>${Т("Предел тупиков")} <input type="number" name="предел" value="0" min="0" step="1"></label>
        <label>${Т("Оформление")} <select name="тема">${темы}</select></label>
        <label>${Т("Макрос при разгадке")} <input type="text" name="макрос" placeholder="${Т("необязательно")}"></label>
        <label>${Т("Макрос при тупике")} <input type="text" name="макросТупика" placeholder="${Т("что случится в пустом мире")}"></label>
        <fieldset>
          <legend>${Т("Кто ведёт отряд")}</legend>
          <label class="uo-igrok"><input type="radio" name="кто" value="все" checked> ${Т("Все игроки")}</label>
          <label class="uo-igrok"><input type="radio" name="кто" value="отмеченные"> ${Т("Только отмеченные ниже")}</label>
          ${игроки || `<p class="uo-podskazka">${Т("Игроков в мире нет.")}</p>`}
        </fieldset>
        ${полеЗаготовки(имяЗаготовки)}
      </div>`,
    buttons: [
      {
        action: "выложить", label: Т("Выложить на стол"), default: true,
        callback: async (event, кнопка, диалог) => {
          const э = диалог.element;
          const зн = имя => э.querySelector(`[name="${имя}"]`)?.value ?? "";
          const поимённо = э.querySelector(`[name="кто"][value="отмеченные"]`)?.checked;

          return выложить(await запомнитьИзДиалога("puti", э, {
            название: зн("название").trim(), подпись: зн("подпись").trim(),
            узлы: зн("узлы"), рёбра: зн("рёбра"),
            начало: зн("начало"), цель: зн("цель"), обязательные: зн("обязательные"),
            предел: зн("предел"), тема: зн("тема").trim(),
            макрос: зн("макрос").trim(), макросТупика: зн("макросТупика").trim(),
            идут: поимённо ? [...э.querySelectorAll(`[name="игрок"]:checked`)].map(и => и.value) : [],
          }));
        },
      },
      { action: "отмена", label: Т("Отмена") },
    ],
    render: (event, диалог) => заполнить(диалог.element, заготовка),
  });
}

ВИДЫ.set("puti", { имя: М("Карта путей"), ход, выложить, диалог: диалогПутей, Окно: ОкноПутей });

/**
 * Окно настроек загадки с живым видом глазами игрока.
 *
 * Слева — поля загадки (те же, что были в её диалоге), справа — то самое окно,
 * которое увидят игроки, нарисованное по текущим настройкам. Любая правка
 * пересобирает вид. Загадка собирается своей же выкладкой, но в памяти
 * (`составить` в stol.mjs): стол не уходит в мир, пока ведущий не нажмёт
 * «Выложить на стол». Выкладывается ровно то, что было в виде, — для залов,
 * которые собираются случайно, это важно; «Другой вариант» собирает заново.
 *
 * Предупреждения выкладки («код пустой», «некому раздать») показываются под
 * видом, а не всплывают на каждую нажатую клавишу.
 *
 * Если загадка умеет показать разгадку (`разгадка(стол, тайна)` у вида), над
 * видом есть переключатель: «Так увидят игроки» — стол как выложится,
 * «Разгадка» — он же, но решённый.
 */

import {
  ВИДЫ, составить, всеСтолы, убрать, записать, тайнуЗапомнить, перезавести,
} from "./stol.mjs";
import { Т, М } from "./yazyk.mjs";
import { запомнитьИзДиалога } from "./zagotovki.mjs";

const { ApplicationV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/** Игрок, которым смотрим: не ведущий, без персонажа, не в поимённых списках. */
const ИГРОК = { id: "uo-igry-predprosmotr", name: "", isGM: false, character: null };

/**
 * Окно загадки глазами игрока: её же `_renderHTML`, пока `game.user` — игрок.
 * Подмена длится одну отрисовку и снимается в `finally`.
 */
export async function глазамиИгрока(стол) {
  const Окно = ВИДЫ.get(стол?.тип)?.Окно;
  if (!Окно) return "";
  const окно = new Окно({ id: `uo-igry-predprosmotr-${стол.id}`, стол });
  Object.defineProperty(game, "user", { get: () => ({ ...ИГРОК, name: Т("Игрок") }), configurable: true });
  let html;
  try {
    html = await окно._renderHTML();
  } finally {
    delete game.user;
  }
  // Классы окна загадки — на обёртке: на них висят её цвета и раскладка.
  const классы = (Окно.DEFAULT_OPTIONS?.classes ?? ["uo-igry"]).join(" ");
  return `<div class="${экранировать(классы)} uo-predprosmotr-okno">${html}</div>`;
}

export class ОкноНастройки extends ApplicationV2 {
  constructor(options = {}) {
    super(options);
    this.н = options.настройка;
    this.последнее = null;          // { конфиг, стол, тайна, заметки }
    this.разгадкой = false;         // показывать решённым
    this.#освежитьПозже = foundry.utils.debounce(() => this.#освежить(), 350);
  }

  #освежитьПозже;

  static DEFAULT_OPTIONS = {
    classes: ["uo-igry", "uo-nastrojka-okno"],
    tag: "div",
    window: { resizable: true },
    position: { width: 1000, height: "auto" },
    actions: {
      выложить: ОкноНастройки.#выложить,
      другой: ОкноНастройки.#другой,
      вид: ОкноНастройки.#вид,
      отмена: ОкноНастройки.#отмена,
    },
  };

  get title() { return this.н.window?.title ?? Т("Загадка"); }

  async _renderHTML() {
    return `
      <div class="uo-nastrojka">
        <form class="uo-nastrojka-forma" autocomplete="off">${this.н.content}</form>
        <section class="uo-nastrojka-vid">
          <div class="uo-nastrojka-shapka">
            ${ВИДЫ.get(this.н.тип)?.разгадка ? `
              <div class="uo-pereklyuchatel">
                <button type="button" data-action="вид" data-razgadka="0" class="uo-vybran">${Т("Так увидят игроки")}</button>
                <button type="button" data-action="вид" data-razgadka="1">${Т("Разгадка")}</button>
              </div>` : `<h3>${Т("Так увидят игроки")}</h3>`}
            <button type="button" data-action="другой" title="${Т("Собрать заново — для загадок, что собираются случайно")}">
              <i class="fa-solid fa-rotate"></i> ${Т("Другой вариант")}</button>
          </div>
          <div class="uo-nastrojka-igrok"><p class="uo-podskazka">${Т("Собираю…")}</p></div>
          <div class="uo-nastrojka-zametki"></div>
        </section>
      </div>
      <div class="uo-cherda-deistvija">
        <button type="button" data-action="выложить"><i class="fa-solid fa-table-cells"></i> ${Т("Выложить на стол")}</button>
        <button type="button" data-action="отмена">${Т("Отмена")}</button>
      </div>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }

  _onFirstRender() {
    const э = this.element;
    /*
     * Поля — в своей форме: переключатели «кто крутит» с одним именем иначе
     * сливаются в группу со всеми открытыми окнами, и соседнее окно снимает
     * выбор. Enter в поле формы ничего не отправляет.
     */
    э.querySelector(".uo-nastrojka-forma").addEventListener("submit", событие => событие.preventDefault());
    // Прежний хук диалога: заполнить поля из заготовки, повесить свои кнопки.
    this.н.render?.(null, { element: э, close: () => this.close(), окно: this });
    э.querySelector(".uo-nastrojka-forma").addEventListener("input", () => this.#освежитьПозже());
    э.querySelector(".uo-nastrojka-forma").addEventListener("change", () => this.#освежитьПозже());
    this.#освежить();
  }

  /** Снять настройки из полей; предупреждения снятия — тоже в заметки, не всплывающими. */
  #снять() {
    const э = this.element?.querySelector(".uo-nastrojka-forma");
    if (!э) return null;
    try {
      return this.н.снять(э) ?? null;
    } catch (e) {
      console.error("uo-igry | настройки не снялись", e);
      return null;
    }
  }

  async #освежить() {
    const конфиг = this.#снять();
    const вид = this.element?.querySelector(".uo-nastrojka-igrok");
    const поле = this.element?.querySelector(".uo-nastrojka-zametki");
    if (!вид || !конфиг) return null;

    const собранное = await составить(this.н.тип, конфиг);
    this.последнее = { конфиг, ...собранное };
    await this.#показать();
    поле.innerHTML = собранное.заметки.map(з =>
      `<p class="uo-zametka uo-zametka-${з.уровень}">${экранировать(з.текст)}</p>`).join("");
    return this.последнее;
  }

  /** Нарисовать вид: стол как выложится или, если выбрано, решённым. */
  async #показать() {
    const вид = this.element?.querySelector(".uo-nastrojka-igrok");
    const собранное = this.последнее;
    if (!вид || !собранное) return;
    const разгадка = ВИДЫ.get(this.н.тип)?.разгадка;
    const стол = собранное.стол && this.разгадкой && разгадка
      ? разгадка(собранное.стол, собранное.тайна)
      : собранное.стол;
    вид.innerHTML = стол
      ? await глазамиИгрока(стол)
      : `<p class="uo-podskazka">${Т("По этим настройкам загадка не складывается — см. ниже.")}</p>`;
  }

  static #вид(event, target) {
    this.разгадкой = target.dataset.razgadka === "1";
    this.element.querySelectorAll("[data-razgadka]").forEach(к =>
      к.classList.toggle("uo-vybran", (к.dataset.razgadka === "1") === this.разгадкой));
    this.#показать();
  }

  static #другой() { this.#освежить(); }

  static #отмена() { this.close(); }

  /**
   * Выложить ровно то, что было в виде. Настройки поменялись после последней
   * сборки (или сборки не было) — сперва собираем по ним.
   */
  static async #выложить() {
    const форма = this.element.querySelector(".uo-nastrojka-forma");
    const конфиг = this.#снять();
    if (!конфиг) return;
    await запомнитьИзДиалога(this.н.тип, форма, конфиг);

    let готовое = this.последнее;
    if (!готовое || JSON.stringify(готовое.конфиг) !== JSON.stringify(конфиг)) готовое = await this.#освежить();
    if (!готовое?.стол) {
      ui.notifications.error(готовое?.заметки?.[0]?.текст || Т("По этим настройкам загадка не складывается."));
      return;
    }

    const стол = foundry.utils.deepClone(готовое.стол);
    // Часы заводятся с выкладки, а не с того мига, когда собрался вид.
    if (стол.таймер) стол.таймер = перезавести(стол.таймер);

    // Как в выкладке загадки: разгаданное вчера того же вида — со стола.
    for (const [id, с] of Object.entries(всеСтолы())) {
      if (с.тип === стол.тип && с.завершён) await убрать(id);
    }
    if (готовое.тайна) await тайнуЗапомнить(стол.id, готовое.тайна);
    await записать(стол);
    await ВИДЫ.get(стол.тип)?.послеВыкладки?.(стол);
    this.close();
  }
}

/**
 * Открыть настройку загадки. Принимает то же, что прежний диалог: заголовок,
 * разметку полей, хук `render` — и вместо кнопки `снять(форма) → настройки`.
 */
export function настройка(опции) {
  if (!game.user.isGM) return null;
  const окно = new ОкноНастройки({
    настройка: опции,
    window: { title: опции.window?.title, icon: опции.window?.icon, resizable: true },
  });
  окно.render({ force: true });
  return окно;
}

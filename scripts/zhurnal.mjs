/**
 * Взять текст из журнала мира.
 *
 * Длинную надпись ведущий редко сочиняет в поле диалога: она уже написана
 * в журнале — пророчество, письмо, надгробная плита. Перенабирать её руками
 * глупо, а копировать через буфер — терять переносы строк.
 *
 * Поэтому у длинных полей есть кнопка «Из журнала…»: выбрал запись, выбрал
 * страницу — текст лёг в поле. Дальше его можно править как обычно: связи
 * с журналом не остаётся, и правка страницы задним числом загадку не тронет.
 * Так и задумано — выложенная загадка не должна меняться сама по себе.
 */
import { Т } from "./yazyk.mjs";

const { DialogV2 } = foundry.applications.api;
const экранировать = s => foundry.utils.escapeHTML(String(s ?? ""));

/**
 * Разметка страницы — в простой текст.
 *
 * Из журнала приходит HTML: абзацы, заголовки, списки, ссылки на другие
 * записи. Загадке нужны только слова и переносы строк, поэтому разметка
 * снимается, а блочные теги превращаются в переносы — иначе три абзаца
 * слиплись бы в одну строку.
 */
export function вПростойТекст(html) {
  const узел = document.createElement("div");
  узел.innerHTML = String(html ?? "");
  узел.querySelectorAll("br").forEach(б => б.replaceWith("\n"));
  узел.querySelectorAll("p, div, li, h1, h2, h3, h4, blockquote, tr").forEach(б => б.append("\n"));
  return узел.textContent
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Страницы записи, из которых вообще есть что взять. */
const текстовые = запись => запись.pages.contents
  .filter(с => с.type === "text" && с.text?.content)
  .sort((а, б) => (а.sort ?? 0) - (б.sort ?? 0));

/**
 * Спросить запись и страницу, вернуть текст (или null, если передумали).
 *
 * Записи берутся те, что видит ведущий, вместе с папками: в большом мире
 * их сотни, и без пути по папкам нужную не найти.
 */
export async function взятьИзЖурнала() {
  const записи = game.journal.contents
    .filter(з => з.testUserPermission(game.user, "OBSERVER") && текстовые(з).length)
    .sort((а, б) => а.name.localeCompare(б.name, game.i18n.lang));

  if (!записи.length) {
    ui.notifications.warn(Т("В журнале нет записей с текстом."));
    return null;
  }

  const путь = з => (з.folder ? `${з.folder.name} / ` : "");
  const выборЗаписей = записи.map(з =>
    `<option value="${з.id}">${экранировать(путь(з) + з.name)}</option>`).join("");
  const страницы = з => текстовые(з).map(с =>
    `<option value="${с.id}">${экранировать(с.name)}</option>`).join("");

  const содержимое = `
    <div class="uo-forma">
      <label>${Т("Запись")} <select name="запись">${выборЗаписей}</select></label>
      <label>${Т("Страница")} <select name="страница">${страницы(записи[0])}</select></label>
      <p class="uo-podskazka">${Т("Текст ляжет в поле и дальше правится как обычно: со страницей он не связан, и её правка загадку не тронет.")}</p>
      <p class="uo-zhurnal-proba uo-podskazka"></p>
    </div>`;

  return DialogV2.wait({
    window: { title: Т("Взять из журнала"), icon: "fa-solid fa-book-open" },
    position: { width: 520 },
    content: содержимое,
    buttons: [
      {
        action: "взять", label: Т("Взять"), default: true,
        callback: (событие, кнопка, диалог) => {
          // Кнопка окна DialogV2 НЕ привязана к форме (button.form пуст),
          // а третьим доводом приходит сам элемент окна, не приложение.
          const э = кнопка?.closest?.(".application") ?? диалог?.element ?? диалог;
          const запись = game.journal.get(э.querySelector(`[name="запись"]`).value);
          const стр = запись?.pages.get(э.querySelector(`[name="страница"]`).value);
          return стр ? вПростойТекст(стр.text.content) : null;
        },
      },
      { action: "мимо", label: Т("Отмена") },
    ],
    rejectClose: false,
    render: (событие, диалог) => {
      const э = диалог.element ?? диалог;
      const выбор = э.querySelector(`[name="запись"]`);
      const поле = э.querySelector(`[name="страница"]`);
      const проба = э.querySelector(".uo-zhurnal-proba");
      const показать = () => {
        const запись = game.journal.get(выбор.value);
        const стр = запись?.pages.get(поле.value);
        const т = стр ? вПростойТекст(стр.text.content) : "";
        проба.textContent = т ? Т("Знаков: {сколько}. Начало: {начало}…", {
          сколько: т.length, начало: т.slice(0, 60),
        }) : Т("На этой странице текста нет.");
      };
      выбор.addEventListener("change", () => { поле.innerHTML = страницы(game.journal.get(выбор.value)); показать(); });
      поле.addEventListener("change", показать);
      показать();
    },
  }).then(итог => (итог && итог !== "мимо" ? итог : null));
}

/**
 * Кнопка «Из журнала…» для длинного поля.
 *
 * Окно настроек само ловит нажатие по `data-zhurnal` и кладёт текст в поле
 * с этим именем — затее остаётся только вставить кнопку рядом с полем.
 */
export const кнопкаЖурнала = имяПоля => `
  <button type="button" class="uo-iz-zhurnala" data-zhurnal="${имяПоля}"
    data-tooltip="${Т("Взять текст со страницы журнала")}">
    <i class="fa-solid fa-book-open"></i> ${Т("Из журнала…")}</button>`;

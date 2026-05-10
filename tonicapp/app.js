const state = {
  words: [],
  current: null,
  selectedSyllable: null,
  selectedAccent: null,
  selectedType: null,
  answered: false,
  correct: 0,
  total: 0,
  results: [],
};

const els = {
  wordDisplay: document.querySelector("#wordDisplay"),
  syllableButtons: document.querySelector("#syllableButtons"),
  noAccentButton: document.querySelector("#noAccentButton"),
  accentButton: document.querySelector("#accentButton"),
  acuteButton: document.querySelector("#acuteButton"),
  plainButton: document.querySelector("#plainButton"),
  proparoxytoneButton: document.querySelector("#proparoxytoneButton"),
  validateButton: document.querySelector("#validateButton"),
  nextButton: document.querySelector("#nextButton"),
  finishButton: document.querySelector("#finishButton"),
  feedback: document.querySelector("#feedback"),
  scoreCorrect: document.querySelector("#scoreCorrect"),
  scoreTotal: document.querySelector("#scoreTotal"),
};

const accentMap = new Map([
  ["a", "á"], ["e", "é"], ["i", "í"], ["o", "ó"], ["u", "ú"],
  ["A", "Á"], ["E", "É"], ["I", "Í"], ["O", "Ó"], ["U", "Ú"],
]);

init();

async function init() {
  try {
    const response = await fetch("words.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar words.json");
    const data = await response.json();
    state.words = Object.entries(data).flatMap(([type, entries]) =>
      entries.map((entry) => ({ ...entry, type }))
    );
    pickNextWord();
  } catch (error) {
    els.wordDisplay.textContent = "Error";
    els.feedback.textContent = "No se pudo cargar words.json. Abre la app desde un servidor local.";
  }
}

function pickNextWord() {
  const index = Math.floor(Math.random() * state.words.length);
  state.current = state.words[index];
  state.selectedSyllable = null;
  state.selectedAccent = null;
  state.selectedType = null;
  state.answered = false;

  const syllables = getSyllables(state.current);
  els.syllableButtons.style.setProperty("--syllable-count", syllables.length);
  els.wordDisplay.textContent = removeAccents(syllables.join(""));
  els.feedback.textContent = "Elige primero la sílaba tónica.";
  els.feedback.className = "feedback";
  els.validateButton.disabled = true;
  els.nextButton.disabled = true;
  els.finishButton.disabled = state.total === 0;
  setTypeButtons(false);
  setAccentButtons(false);
  renderSyllableButtons();
}

function renderSyllableButtons() {
  const syllables = getSyllables(state.current);
  els.syllableButtons.replaceChildren(
    ...syllables.map((syllable, index) => {
      const button = document.createElement("button");
      button.className = "syllable-button";
      button.type = "button";
      button.textContent = removeAccents(syllable);
      button.disabled = state.answered;
      button.setAttribute("aria-pressed", String(state.selectedSyllable === index + 1));
      if (state.selectedSyllable === index + 1) button.classList.add("is-selected");
      button.addEventListener("click", () => selectSyllable(index + 1));
      return button;
    })
  );
}

function selectSyllable(position) {
  state.selectedSyllable = position;
  state.selectedType = null;
  state.selectedAccent = null;
  setTypeButtons(true);
  setAccentButtons(false);
  els.feedback.textContent = "Ahora elige si es esdrújula, llana o aguda.";
  renderSyllableButtons();
  updateValidateButton();
}

function setTypeButtons(enabled) {
  const buttons = [
    [els.proparoxytoneButton, "esdrujulas"],
    [els.plainButton, "planas"],
    [els.acuteButton, "agudas"],
  ];

  buttons.forEach(([button, type]) => {
    button.disabled = !enabled || state.answered;
    button.classList.toggle("is-selected", state.selectedType === type);
  });
}

function selectType(type) {
  state.selectedType = type;
  state.selectedAccent = null;
  setTypeButtons(true);
  setAccentButtons(true);
  els.feedback.textContent = "Ahora indica si la palabra debe llevar tilde.";
  updateValidateButton();
}

function setAccentButtons(enabled) {
  els.noAccentButton.disabled = !enabled || state.answered;
  els.accentButton.disabled = !enabled || state.answered;
  els.noAccentButton.classList.toggle("is-selected", state.selectedAccent === false);
  els.accentButton.classList.toggle("is-selected", state.selectedAccent === true);
}

function selectAccent(hasAccent) {
  state.selectedAccent = hasAccent;
  setAccentButtons(true);
  updateValidateButton();
}

function updateValidateButton() {
  els.validateButton.disabled =
    state.answered ||
    state.selectedSyllable === null ||
    state.selectedType === null ||
    state.selectedAccent === null;
}

function validateAnswer() {
  const current = state.current;
  const correct =
    state.selectedSyllable === current.tonicSyllable &&
    state.selectedType === current.type &&
    state.selectedAccent === current.hasAccent;
  state.answered = true;
  state.total += 1;
  if (correct) state.correct += 1;

  const userWord = buildUserWord();
  const correctWord = getSyllables(current).join("");
  const correctType = labelType(current.type);
  const result = {
    word: correctWord,
    type: correctType,
    correct,
  };
  state.results.push(result);

  els.wordDisplay.textContent = userWord;
  els.feedback.className = `feedback ${correct ? "is-correct" : "is-wrong"}`;
  els.feedback.innerHTML = correct
    ? `Correcto.<span class="answer-word">${correctWord} · ${correctType}</span>`
    : `Revisa la respuesta. La forma correcta es:<span class="answer-word">${correctWord} · ${correctType}</span>`;

  els.scoreCorrect.textContent = state.correct;
  els.scoreTotal.textContent = state.total;
  els.validateButton.disabled = true;
  els.nextButton.disabled = false;
  els.finishButton.disabled = false;
  setAccentButtons(false);
  setTypeButtons(false);
  renderSyllableButtons();
}

function finishPractice() {
  const correctWords = state.results.filter((result) => result.correct);
  const incorrectWords = state.results.filter((result) => !result.correct);

  els.wordDisplay.textContent = "Resumen";
  els.syllableButtons.replaceChildren();
  els.syllableButtons.style.setProperty("--syllable-count", 1);
  els.feedback.className = "feedback summary";
  els.feedback.innerHTML = `
    <strong>Resultado: ${state.correct} de ${state.total} correctas.</strong>
    ${renderResultList("Correctas", correctWords)}
    ${renderResultList("Incorrectas", incorrectWords)}
  `;

  state.answered = true;
  els.validateButton.disabled = true;
  els.nextButton.disabled = false;
  els.finishButton.disabled = true;
  setAccentButtons(false);
  setTypeButtons(false);
}

function renderResultList(title, results) {
  const items = results.length
    ? results.map((result) => `<li>${result.word} · ${result.type}</li>`).join("")
    : "<li>Ninguna</li>";
  return `<div class="summary-block"><span>${title}</span><ul>${items}</ul></div>`;
}

function buildUserWord() {
  return getSyllables(state.current)
    .map((syllable, index) => {
      const plain = removeAccents(syllable);
      if (state.selectedAccent && state.selectedSyllable === index + 1) {
        if (state.current.hasAccent && state.current.tonicSyllable === index + 1) return syllable;
        return addAccentToSyllable(plain);
      }
      return plain;
    })
    .join("");
}

function addAccentToSyllable(syllable) {
  const chars = [...syllable];
  let index = chars.findIndex((char) => /[aeoAEO]/.test(char));
  if (index < 0) index = chars.findIndex((char) => /[iuIU]/.test(char));
  if (index < 0) return syllable;
  chars[index] = accentMap.get(chars[index]);
  return chars.join("");
}

function getSyllables(word) {
  return word.word.split("-");
}

function removeAccents(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function labelType(type) {
  return type === "agudas" ? "aguda" : type === "planas" ? "llana" : "esdrújula";
}

els.noAccentButton.addEventListener("click", () => selectAccent(false));
els.accentButton.addEventListener("click", () => selectAccent(true));
els.proparoxytoneButton.addEventListener("click", () => selectType("esdrujulas"));
els.plainButton.addEventListener("click", () => selectType("planas"));
els.acuteButton.addEventListener("click", () => selectType("agudas"));
els.validateButton.addEventListener("click", validateAnswer);
els.nextButton.addEventListener("click", pickNextWord);
els.finishButton.addEventListener("click", finishPractice);

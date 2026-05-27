const state = {
  words: [],
  whyOptions: [],
  current: null,
  stage: "type",
  score: 0,
  streak: 0,
  timer: null,
};

const els = {
  word: document.querySelector("#word"),
  prompt: document.querySelector("#prompt"),
  typeOptions: document.querySelector("#type-options"),
  whyOptions: document.querySelector("#why-options"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#next"),
  restart: document.querySelector("#restart"),
  score: document.querySelector("#score"),
  streak: document.querySelector("#streak"),
};

async function boot() {
  try {
    const response = await fetch("words.json");
    if (!response.ok) {
      throw new Error("No s'ha pogut carregar words.json");
    }

    state.words = await response.json();
    state.whyOptions = unique(state.words.map((item) => item.why)).sort((a, b) => a.localeCompare(b, "ca"));
    bindEvents();
    nextWord();
  } catch (error) {
    els.prompt.textContent = "No s'ha pogut iniciar l'activitat.";
    els.word.textContent = "Revisa el fitxer words.json";
    setFeedback(error.message, "bad");
  }
}

function bindEvents() {
  els.typeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button || state.stage !== "type") return;
    chooseType(button.dataset.type, button);
  });

  els.whyOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-why]");
    if (!button || state.stage !== "why") return;
    chooseWhy(button.dataset.why, button);
  });

  els.next.addEventListener("click", nextWord);
  els.restart.addEventListener("click", restart);
}

function nextWord() {
  window.clearTimeout(state.timer);
  state.current = pickRandom(state.words);
  state.stage = "type";

  els.prompt.textContent = "Quin so té la essa marcada?";
  els.next.classList.add("hidden");
  els.typeOptions.classList.remove("hidden");
  els.whyOptions.classList.add("hidden");
  els.whyOptions.innerHTML = "";
  clearButtons(els.typeOptions);
  setFeedback("");
  renderWord(state.current);
}

function chooseType(type, button) {
  const correct = type === state.current.type;
  disableButtons(els.typeOptions);

  if (!correct) {
    button.classList.add("wrong");
    markButton(els.typeOptions, state.current.type, "type");
    state.streak = 0;
    updateStats();
    setFeedback(`No ben bé. La resposta correcta és ${state.current.type}: ${state.current.why}.`, "bad");
    els.next.classList.remove("hidden");
    return;
  }

  button.classList.add("correct");
  state.stage = "why";
  els.prompt.textContent = "Molt bé. Per què sona així?";
  setFeedback("Correcte. Ara tria la regla.", "good");
  renderWhyOptions();
}

function renderWhyOptions() {
  const options = buildWhyChoices(state.current.why);
  els.whyOptions.innerHTML = options
    .map((option) => `<button class="why-button" type="button" data-why="${escapeAttribute(option)}">${option}</button>`)
    .join("");
  els.whyOptions.classList.remove("hidden");
}

function chooseWhy(why, button) {
  const correct = why === state.current.why;
  disableButtons(els.whyOptions);

  if (!correct) {
    button.classList.add("wrong");
    markButton(els.whyOptions, state.current.why, "why");
    state.streak = 0;
    updateStats();
    setFeedback(`La regla correcta és: ${state.current.why}.`, "bad");
    els.next.classList.remove("hidden");
    return;
  }

  button.classList.add("correct");
  state.score += 1;
  state.streak += 1;
  updateStats();
  setFeedback("Perfecte. Anem a la següent.", "good");
  state.timer = window.setTimeout(nextWord, 900);
}

function renderWord(item) {
  const letters = Array.from(item.word);
  const markedIndex = Math.max(0, Number(item.position) - 1);
  const markedLength = Math.max(1, Number(item.length ?? item.lenght ?? 1));
  const markedEnd = markedIndex + markedLength;
  const before = letters.slice(0, markedIndex);
  const marked = letters.slice(markedIndex, markedEnd);
  const after = letters.slice(markedEnd);

  els.word.innerHTML = [
    ...before.map((letter) => `<span class="letter">${escapeHtml(letter)}</span>`),
    `<span class="letter marked">${escapeHtml(marked.join(""))}</span>`,
    ...after.map((letter) => `<span class="letter">${escapeHtml(letter)}</span>`),
  ].join("");
}

function buildWhyChoices(correctWhy) {
  const pool = state.whyOptions.filter((why) => why !== correctWhy);
  return shuffle([correctWhy, ...shuffle(pool).slice(0, Math.min(3, pool.length))]);
}

function restart() {
  state.score = 0;
  state.streak = 0;
  updateStats();
  nextWord();
}

function updateStats() {
  els.score.textContent = state.score;
  els.streak.textContent = state.streak;
}

function setFeedback(message, tone = "") {
  els.feedback.textContent = message;
  els.feedback.className = `feedback ${tone}`.trim();
}

function clearButtons(container) {
  container.querySelectorAll("button").forEach((button) => {
    button.disabled = false;
    button.classList.remove("correct", "wrong");
  });
}

function disableButtons(container) {
  container.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

function markButton(container, value, kind) {
  const selector = kind === "type" ? `[data-type="${value}"]` : `[data-why="${escapeAttribute(value)}"]`;
  const button = container.querySelector(selector);
  if (button) button.classList.add("correct");
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function unique(items) {
  return [...new Set(items)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

boot();

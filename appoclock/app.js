const hourWords = [
  "twelve",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
];

const minuteWords = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
  "twenty-two",
  "twenty-three",
  "twenty-four",
  "twenty-five",
  "twenty-six",
  "twenty-seven",
  "twenty-eight",
  "twenty-nine",
  "thirty",
  "thirty-one",
  "thirty-two",
  "thirty-three",
  "thirty-four",
  "thirty-five",
  "thirty-six",
  "thirty-seven",
  "thirty-eight",
  "thirty-nine",
  "forty",
  "forty-one",
  "forty-two",
  "forty-three",
  "forty-four",
  "forty-five",
  "forty-six",
  "forty-seven",
  "forty-eight",
  "forty-nine",
  "fifty",
  "fifty-one",
  "fifty-two",
  "fifty-three",
  "fifty-four",
  "fifty-five",
  "fifty-six",
  "fifty-seven",
  "fifty-eight",
  "fifty-nine",
];

const dayParts = [
  { label: "in the morning", suffix: "a.m.", hours: [6, 7, 8, 9, 10, 11] },
  { label: "in the afternoon", suffix: "p.m.", hours: [12, 13, 14, 15, 16, 17] },
  { label: "in the evening", suffix: "p.m.", hours: [18, 19, 20] },
  { label: "at night", suffix: "p.m.", hours: [21, 22, 23, 0, 1, 2, 3, 4, 5] },
];

const state = {
  level: 1,
  clockType: "analog",
  score: 0,
  current: null,
  selectedWords: [],
  answered: false,
};

const elements = {
  levelSelect: document.querySelector("#levelSelect"),
  analogClock: document.querySelector("#analogClock"),
  digitalClock: document.querySelector("#digitalClock"),
  digitalTime: document.querySelector("#digitalTime"),
  hourHand: document.querySelector("#hourHand"),
  minuteHand: document.querySelector("#minuteHand"),
  promptText: document.querySelector("#promptText"),
  scoreText: document.querySelector("#scoreText"),
  choiceOptions: document.querySelector("#choiceOptions"),
  typedAnswerWrap: document.querySelector("#typedAnswerWrap"),
  typedAnswer: document.querySelector("#typedAnswer"),
  wordBank: document.querySelector("#wordBank"),
  answerSlots: document.querySelector("#answerSlots"),
  feedback: document.querySelector("#feedback"),
  checkButton: document.querySelector("#checkButton"),
  clearButton: document.querySelector("#clearButton"),
  nextButton: document.querySelector("#nextButton"),
  clockButtons: document.querySelectorAll("[data-clock]"),
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function hourWord(hour) {
  return hourWords[hour % 12];
}

function displayHour(hour) {
  const normalized = hour % 12;
  return normalized === 0 ? 12 : normalized;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function digitalPhrase(hour, minute, suffix = "") {
  const base = minute === 0
    ? `${hourWord(hour)} o'clock`
    : `${hourWord(hour)} ${minuteWords[minute]}`;
  return suffix ? `${base} ${suffix}` : base;
}

function traditionalPhrase(hour, minute) {
  if (minute === 0) return `${hourWord(hour)} o'clock`;
  if (minute === 15) return `quarter past ${hourWord(hour)}`;
  if (minute === 30) return `half past ${hourWord(hour)}`;
  if (minute === 45) return `quarter to ${hourWord(hour + 1)}`;
  if (minute <= 30) return `${minuteWords[minute]} past ${hourWord(hour)}`;
  return `${minuteWords[60 - minute]} to ${hourWord(hour + 1)}`;
}

function withIts(phrase) {
  return `It's ${phrase}`;
}

function getDayPart(hour24) {
  return dayParts.find((part) => part.hours.includes(hour24)) ?? dayParts[0];
}

function makeTimeForLevel(level) {
  const hour = randomInt(1, 12);
  let minute = 0;
  let hour24 = hour;

  if (level === 1) minute = 0;
  if (level === 2) minute = randomInt(1, 59);
  if (level === 3) minute = [15, 30, 45][randomInt(0, 2)];
  if (level === 4) minute = randomInt(1, 59);
  if (level === 5) {
    hour24 = randomInt(0, 23);
    minute = [0, 5, 10, 15, 20, 25, 30, 32, 35, 40, 45, 50, 55][randomInt(0, 12)];
  }

  return { hour, minute, hour24 };
}

function answerFor(level, time) {
  const hour = level === 5 ? displayHour(time.hour24) : time.hour;
  const part = getDayPart(time.hour24);

  if (level === 1) return withIts(digitalPhrase(hour, 0));
  if (level === 2) return withIts(digitalPhrase(hour, time.minute));
  if (level === 3) return withIts(traditionalPhrase(hour, time.minute));
  if (level === 4) return withIts(traditionalPhrase(hour, time.minute));

  const variants = [
    () => withIts(digitalPhrase(hour, time.minute)),
    () => withIts(traditionalPhrase(hour, time.minute)),
    () => withIts(`${traditionalPhrase(hour, time.minute)} ${part.label}`),
    () => withIts(`${digitalPhrase(hour, time.minute)} ${part.suffix}`),
  ];

  if (time.minute === 0) {
    variants.push(
      () => withIts(`${hourWord(hour)} sharp`),
      () => withIts(`about ${hourWord(hour)}`),
    );
  }

  if (time.minute === 30) {
    variants.push(() => withIts(`around ${hourWord(hour)} thirty`));
  }

  return variants[randomInt(0, variants.length - 1)]();
}

function generateQuestion() {
  const sourceLevel = state.level >= 4 ? randomInt(1, state.level) : state.level;
  const time = makeTimeForLevel(sourceLevel);
  const answer = answerFor(sourceLevel, time);
  state.current = { ...time, sourceLevel, answer };
  state.selectedWords = [];
  state.answered = false;
  renderClock();
  renderAnswerMode();
  clearFeedback();
}

function renderClock() {
  const { hour, minute, hour24 } = state.current;
  const visibleHour = state.current.sourceLevel === 5 ? displayHour(hour24) : hour;
  const hourDegrees = (visibleHour % 12) * 30 + minute * 0.5;
  const minuteDegrees = minute * 6;

  elements.hourHand.style.transform = `rotate(${hourDegrees}deg)`;
  elements.minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
  elements.digitalTime.textContent = `${pad(visibleHour)}:${pad(minute)}`;

  elements.analogClock.classList.toggle("is-hidden", state.clockType !== "analog");
  elements.digitalClock.classList.toggle("is-hidden", state.clockType !== "digital");
}

function renderAnswerMode() {
  const usesChoices = state.level <= 3;
  elements.choiceOptions.classList.toggle("is-hidden", !usesChoices);
  elements.typedAnswerWrap.classList.toggle("is-hidden", usesChoices);
  elements.wordBank.classList.toggle("is-hidden", usesChoices);
  elements.answerSlots.classList.toggle("is-hidden", usesChoices);
  elements.checkButton.classList.toggle("is-hidden", usesChoices);
  elements.clearButton.classList.toggle("is-hidden", usesChoices);
  elements.promptText.textContent = usesChoices
    ? "Elige la frase correcta en ingles."
    : "Escribe la respuesta o ordena las palabras.";

  if (usesChoices) renderChoices();
  else renderWordPuzzle();
}

function renderChoices() {
  const correct = state.current.answer;
  const options = new Set([correct]);

  while (options.size < 4) {
    const wrongTime = makeTimeForLevel(state.current.sourceLevel);
    options.add(answerFor(state.current.sourceLevel, wrongTime));
  }

  elements.choiceOptions.innerHTML = "";
  shuffle([...options]).forEach((option) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => checkChoice(button, option));
    elements.choiceOptions.append(button);
  });
}

function renderWordPuzzle() {
  elements.wordBank.innerHTML = "";
  elements.answerSlots.innerHTML = "";
  elements.typedAnswer.value = "";
  elements.typedAnswer.disabled = false;
  const words = state.current.answer.split(" ");

  shuffle(words).forEach((word, index) => {
    const button = document.createElement("button");
    button.className = "word";
    button.type = "button";
    button.textContent = word;
    button.dataset.index = String(index);
    button.addEventListener("click", () => selectWord(button));
    elements.wordBank.append(button);
  });
}

function selectWord(button) {
  if (state.answered) return;
  if (button.disabled) return;
  button.disabled = true;
  state.selectedWords.push({ word: button.textContent, source: button });
  renderSelectedWords();
}

function renderSelectedWords() {
  elements.answerSlots.innerHTML = "";
  state.selectedWords.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "slot";
    button.type = "button";
    button.textContent = item.word;
    button.addEventListener("click", () => removeSelectedWord(index));
    elements.answerSlots.append(button);
  });
}

function removeSelectedWord(index) {
  const [item] = state.selectedWords.splice(index, 1);
  item.source.disabled = false;
  renderSelectedWords();
}

function checkChoice(button, option) {
  if (state.answered) return;
  const isCorrect = option === state.current.answer;
  [...elements.choiceOptions.children].forEach((child) => {
    child.disabled = true;
    if (child.textContent === state.current.answer) child.classList.add("correct");
  });
  if (!isCorrect) button.classList.add("incorrect");
  finishAttempt(isCorrect);
}

function checkWordAnswer() {
  if (state.answered) return;
  const typedAnswer = elements.typedAnswer.value;
  const orderedAnswer = state.selectedWords.map((item) => item.word).join(" ");
  const answer = typedAnswer.trim() ? typedAnswer : orderedAnswer;
  finishAttempt(normalizeAnswer(answer) === normalizeAnswer(state.current.answer));
}

function finishAttempt(isCorrect) {
  state.answered = true;
  elements.typedAnswer.disabled = true;
  if (isCorrect) {
    state.score += 1;
    elements.feedback.textContent = "Correcto.";
    elements.feedback.className = "feedback success";
    setTimeout(generateQuestion, 650);
  } else {
    elements.feedback.textContent = `Casi. Respuesta: ${state.current.answer}`;
    elements.feedback.className = "feedback error";
  }
  elements.scoreText.textContent = `${state.score} correctas`;
}

function clearFeedback() {
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
}

function clearWordAnswer() {
  if (state.answered) return;
  elements.typedAnswer.value = "";
  state.selectedWords.forEach((item) => {
    item.source.disabled = false;
  });
  state.selectedWords = [];
  renderSelectedWords();
  clearFeedback();
}

function normalizeAnswer(answer) {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
}

elements.levelSelect.addEventListener("change", (event) => {
  state.level = Number(event.target.value);
  generateQuestion();
});

elements.clockButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.clockType = button.dataset.clock;
    elements.clockButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    renderClock();
  });
});

elements.checkButton.addEventListener("click", checkWordAnswer);
elements.clearButton.addEventListener("click", clearWordAnswer);
elements.nextButton.addEventListener("click", generateQuestion);
elements.typedAnswer.addEventListener("keydown", (event) => {
  if (event.key === "Enter") checkWordAnswer();
});

generateQuestion();

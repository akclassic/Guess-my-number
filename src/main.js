import './style.css';

const app = document.querySelector('#app');

const state = {
  secret: generateNumber(),
  guessCount: 0,
  history: [],
  lastMessage: 'Start guessing...',
};

function generateNumber() {
  return Math.floor(Math.random() * 20) + 1;
}

function render() {
  app.innerHTML = `
    <div class="card">
      <div class="header">
        <h1 class="title">Guess My Number</h1>
        <span class="badge">1 - 20</span>
      </div>

      <p class="instructions">Enter a number between 1 and 20. We'll tell you if you need to go higher or lower.</p>

      <div class="stats">
        <div class="stat">
          <span class="stat-label">Guesses</span>
          <span class="stat-value">${state.guessCount}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Status</span>
          <span class="stat-value">${state.lastMessage}</span>
        </div>
      </div>

      <form class="form" id="guess-form">
        <input type="number" name="guess" min="1" max="20" required placeholder="Enter your guess" />
        <button type="submit">Check</button>
      </form>

      <div class="message" aria-live="polite">
        <strong>Hint:</strong> ${state.lastMessage}
      </div>

      <div class="history">
        <p class="history-title">Your guesses</p>
        <ul class="history-list">
          ${state.history.map((value) => `<li class="history-item">${value}</li>`).join('') || '<li class="history-item">No guesses yet</li>'}
        </ul>
      </div>

      <div class="reset">
        <button type="button" id="reset-btn">Reset Game</button>
      </div>
    </div>
  `;

  const form = document.querySelector('#guess-form');
  form?.addEventListener('submit', handleGuessSubmit);

  const resetBtn = document.querySelector('#reset-btn');
  resetBtn?.addEventListener('click', resetGame);
}

function handleGuessSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const value = Number(formData.get('guess'));

  if (!Number.isInteger(value) || value < 1 || value > 20) {
    state.lastMessage = 'Please enter a whole number between 1 and 20.';
    render();
    return;
  }

  state.guessCount += 1;
  state.history.unshift(value);

  if (value === state.secret) {
    state.lastMessage = `🎉 Correct! The number was ${state.secret}.`;
  } else if (value > state.secret) {
    state.lastMessage = 'Too high! Try a lower number.';
  } else {
    state.lastMessage = 'Too low! Try a higher number.';
  }

  render();
}

function resetGame() {
  state.secret = generateNumber();
  state.guessCount = 0;
  state.history = [];
  state.lastMessage = 'Start guessing...';
  render();
}

render();

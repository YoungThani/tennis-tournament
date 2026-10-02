// Matches page: list, create, edit and delete matches.

const form = document.getElementById('match-form');
const fields = form.elements; // the inputs inside the form, by name
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const formError = document.getElementById('form-error');

const STATUS_LABELS = {
  scheduled: 'Upcoming',
  in_progress: '● Live',
  completed: 'Final',
};

let matches = [];       // the latest list from the server
let players = [];       // all players, for the two player dropdowns
let editingId = null;   // the id of the match being edited, or null when adding

// A date/time box needs "2026-10-03T18:00" in *local* time,
// but the server gives us UTC like "2026-10-03T12:30:00.000Z". This converts it.
function toLocalInputValue(isoString) {
  const date = new Date(isoString);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

// Fill both player dropdowns with every player
function showPlayerOptions() {
  const options = players
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(countryIoc(p.country))})</option>`)
    .join('');
  fields.player1Id.innerHTML = '<option value="">Choose player 1</option>' + options;
  fields.player2Id.innerHTML = '<option value="">Choose player 2</option>' + options;
}

function showMatches() {
  const tbody = document.getElementById('matches-body');

  if (matches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No matches yet. Create one above.</td></tr>';
    return;
  }

  tbody.innerHTML = matches.map((m) => `
    <tr>
      <td>${formatDate(m.scheduledAt)}</td>
      <td>${escapeHtml(m.round)}</td>
      <td>${escapeHtml(m.court)}</td>
      <td>${flag(m.player1.country)} <strong>${escapeHtml(m.player1.name)}</strong> vs ${flag(m.player2.country)} <strong>${escapeHtml(m.player2.name)}</strong></td>
      <td><span class="badge ${m.status === 'in_progress' ? 'live' : ''} ${m.status === 'completed' ? 'done' : ''}">${STATUS_LABELS[m.status]}</span></td>
      <td class="actions">
        <a class="button-link" href="/score.html?id=${m.id}">Score</a>
        <button class="small secondary" onclick="startEdit(${m.id})">Edit</button>
        <button class="small danger" onclick="deleteMatch(${m.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadMatches() {
  try {
    matches = await api('GET', '/api/matches');
    showMatches();
    revealOnScroll(document.querySelector('main'));
  } catch (err) {
    document.getElementById('matches-body').innerHTML =
      `<tr><td colspan="6" class="error">Could not load matches: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadPlayers() {
  players = await api('GET', '/api/players');
  showPlayerOptions();
}

// Put a match's details into the form so they can be changed
function startEdit(id) {
  const match = matches.find((m) => m.id === id);
  editingId = id;

  fields.player1Id.value = match.player1Id;
  fields.player2Id.value = match.player2Id;
  fields.round.value = match.round;
  fields.court.value = match.court;
  fields.scheduledAt.value = toLocalInputValue(match.scheduledAt);
  fields.bestOf.value = match.bestOf;
  fields.status.value = match.status;

  formTitle.textContent = `Edit match: ${match.player1.name} vs ${match.player2.name}`;
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  formError.textContent = '';
  form.scrollIntoView({ behavior: 'smooth' });
}

// Empty the form and go back to "create" mode
function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Create a match';
  submitButton.textContent = 'Create match';
  cancelButton.hidden = true;
  formError.textContent = '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page

  const data = {
    player1Id: Number(fields.player1Id.value),
    player2Id: Number(fields.player2Id.value),
    round: fields.round.value.trim(),
    court: fields.court.value.trim(),
    // The date box gives local time; toISOString() converts it to UTC for the server
    scheduledAt: new Date(fields.scheduledAt.value).toISOString(),
    bestOf: Number(fields.bestOf.value),
    status: fields.status.value,
  };

  try {
    if (editingId) {
      await api('PUT', `/api/matches/${editingId}`, data);
    } else {
      await api('POST', '/api/matches', data);
    }
    resetForm();
    loadMatches();
  } catch (err) {
    formError.textContent = err.message;
  }
});

cancelButton.addEventListener('click', resetForm);

async function deleteMatch(id) {
  const match = matches.find((m) => m.id === id);
  if (!confirm(`Delete ${match.player1.name} vs ${match.player2.name}?`)) return;

  try {
    await api('DELETE', `/api/matches/${id}`);
    if (editingId === id) resetForm();
    loadMatches();
  } catch (err) {
    alert(err.message);
  }
}

loadPlayers();
loadMatches();

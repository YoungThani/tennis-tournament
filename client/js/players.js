// Players page: list, add, edit and delete players.

const form = document.getElementById('player-form');
const fields = form.elements; // the inputs inside the form, by name
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const formError = document.getElementById('form-error');

const PLAYS_LABELS = { right: 'Right-handed', left: 'Left-handed' };

let players = [];       // the latest list from the server
let editingId = null;   // the id of the player being edited, or null when adding

// Turn a number input's text into a number, or null if it's empty
function toNumberOrNull(value) {
  return value === '' ? null : Number(value);
}

function showPlayers() {
  const tbody = document.getElementById('players-body');

  if (players.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No players yet. Add one above.</td></tr>';
    return;
  }

  tbody.innerHTML = players.map((p) => `
    <tr>
      <td>${p.ranking ?? '<span class="muted">–</span>'}</td>
      <td><span class="person">${avatar(p.name)}<strong>${escapeHtml(p.name)}</strong></span></td>
      <td>${flag(p.country)} ${escapeHtml(countryName(p.country))}</td>
      <td>${p.age ?? ''}</td>
      <td>${escapeHtml(PLAYS_LABELS[p.plays] || p.plays || '')}</td>
      <td class="muted">${p.coaches.map((c) => escapeHtml(c.name)).join(', ')}</td>
      <td class="actions">
        <button class="small secondary" onclick="startEdit(${p.id})">Edit</button>
        <button class="small danger" onclick="deletePlayer(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadPlayers() {
  try {
    players = await api('GET', '/api/players');
    showPlayers();
    revealOnScroll(document.querySelector('main'));
  } catch (err) {
    document.getElementById('players-body').innerHTML =
      `<tr><td colspan="7" class="error">Could not load players: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Put a player's details into the form so they can be changed
function startEdit(id) {
  const player = players.find((p) => p.id === id);
  editingId = id;

  fields.name.value = player.name;
  fields.country.innerHTML = '<option value="">Choose a country</option>' + countryOptions(player.country);
  fields.ranking.value = player.ranking ?? '';
  fields.age.value = player.age ?? '';
  fields.plays.value = player.plays ?? '';

  formTitle.textContent = `Edit ${player.name}`;
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  formError.textContent = '';
  form.scrollIntoView({ behavior: 'smooth' });
}

// Empty the form and go back to "add" mode
function resetForm() {
  editingId = null;
  form.reset();
  fields.country.innerHTML = '<option value="">Choose a country</option>' + countryOptions('');
  formTitle.textContent = 'Add a player';
  submitButton.textContent = 'Add player';
  cancelButton.hidden = true;
  formError.textContent = '';
}

// Runs when the form is submitted (Add player / Save changes)
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page

  const data = {
    name: fields.name.value.trim(),
    country: fields.country.value,
    ranking: toNumberOrNull(fields.ranking.value),
    age: toNumberOrNull(fields.age.value),
    plays: fields.plays.value || null,
  };

  try {
    if (editingId) {
      await api('PUT', `/api/players/${editingId}`, data);
    } else {
      await api('POST', '/api/players', data);
    }
    resetForm();
    loadPlayers();
  } catch (err) {
    formError.textContent = err.message;
  }
});

cancelButton.addEventListener('click', resetForm);

async function deletePlayer(id) {
  const player = players.find((p) => p.id === id);
  if (!confirm(`Delete ${player.name}?`)) return;

  try {
    await api('DELETE', `/api/players/${id}`);
    if (editingId === id) resetForm();
    loadPlayers();
  } catch (err) {
    alert(err.message); // e.g. "Player has matches and cannot be deleted"
  }
}

resetForm(); // fills the country dropdown
loadPlayers();

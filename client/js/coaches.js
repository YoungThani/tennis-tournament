// Coaches page: list, add, edit and delete coaches, and link players to them.

const form = document.getElementById('coach-form');
const fields = form.elements; // the inputs inside the form, by name
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const formError = document.getElementById('form-error');

let coaches = [];       // the latest list from the server
let players = [];       // all players, for the "link a player" dropdowns
let editingId = null;   // the id of the coach being edited, or null when adding

// Build the HTML for one coach card
function coachCard(coach) {
  // Players already linked, each with a ✕ button to unlink
  const linked = coach.players.map((p) => `
    <span class="chip">
      ${flag(p.country)} ${escapeHtml(p.name)}
      <button class="chip-remove" title="Unlink" onclick="unlinkPlayer(${coach.id}, ${p.id})">✕</button>
    </span>
  `).join('');

  // Only offer players who aren't linked to this coach yet
  const linkedIds = coach.players.map((p) => p.id);
  const options = players
    .filter((p) => !linkedIds.includes(p.id))
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="person">
            ${avatar(coach.name)}
            <strong>${escapeHtml(coach.name)}</strong>
            ${coach.country ? `${flag(coach.country)} <span class="muted">${escapeHtml(countryName(coach.country))}</span>` : ''}
          </span>
        </div>
        <div>
          <button class="small secondary" onclick="startEdit(${coach.id})">Edit</button>
          <button class="small danger" onclick="deleteCoach(${coach.id})">Delete</button>
        </div>
      </div>

      <div class="chips">
        ${linked || '<span class="empty">No players linked yet.</span>'}
      </div>

      ${options ? `
        <div class="link-row">
          <select id="link-select-${coach.id}">${options}</select>
          <button class="small" onclick="linkPlayer(${coach.id})">Link player</button>
        </div>
      ` : ''}
    </div>
  `;
}

function showCoaches() {
  const list = document.getElementById('coaches-list');
  if (coaches.length === 0) {
    list.innerHTML = '<p class="empty">No coaches yet. Add one above.</p>';
  } else {
    list.innerHTML = coaches.map(coachCard).join('');
  }
}

async function loadCoaches() {
  try {
    coaches = await api('GET', '/api/coaches');
    players = await api('GET', '/api/players');
    showCoaches();
    revealOnScroll(document.querySelector('main'));
  } catch (err) {
    document.getElementById('coaches-list').innerHTML =
      `<p class="error">Could not load coaches: ${escapeHtml(err.message)}</p>`;
  }
}

// ---------- Linking players ----------

async function linkPlayer(coachId) {
  const playerId = document.getElementById(`link-select-${coachId}`).value;
  try {
    await api('POST', `/api/coaches/${coachId}/players/${playerId}`);
    loadCoaches();
  } catch (err) {
    alert(err.message);
  }
}

async function unlinkPlayer(coachId, playerId) {
  try {
    await api('DELETE', `/api/coaches/${coachId}/players/${playerId}`);
    loadCoaches();
  } catch (err) {
    alert(err.message);
  }
}

// ---------- Add / edit / delete coaches ----------

function startEdit(id) {
  const coach = coaches.find((c) => c.id === id);
  editingId = id;

  fields.name.value = coach.name;
  fields.country.innerHTML = '<option value="">No country</option>' + countryOptions(coach.country);

  formTitle.textContent = `Edit ${coach.name}`;
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  formError.textContent = '';
  form.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  form.reset();
  fields.country.innerHTML = '<option value="">No country</option>' + countryOptions('');
  formTitle.textContent = 'Add a coach';
  submitButton.textContent = 'Add coach';
  cancelButton.hidden = true;
  formError.textContent = '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page

  const data = {
    name: fields.name.value.trim(),
    country: fields.country.value || null,
  };

  try {
    if (editingId) {
      await api('PUT', `/api/coaches/${editingId}`, data);
    } else {
      await api('POST', '/api/coaches', data);
    }
    resetForm();
    loadCoaches();
  } catch (err) {
    formError.textContent = err.message;
  }
});

cancelButton.addEventListener('click', resetForm);

async function deleteCoach(id) {
  const coach = coaches.find((c) => c.id === id);
  if (!confirm(`Delete ${coach.name}? Their players will be unlinked (but not deleted).`)) return;

  try {
    await api('DELETE', `/api/coaches/${id}`);
    if (editingId === id) resetForm();
    loadCoaches();
  } catch (err) {
    alert(err.message);
  }
}

resetForm(); // fills the country dropdown
loadCoaches();

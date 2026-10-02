// Live score page: a big scoreboard, plus buttons for the umpire to record points.
// The match id comes from the URL, e.g. /score.html?id=7

const matchId = new URLSearchParams(window.location.search).get('id');
const controls = document.getElementById('umpire-controls');
const errorLine = document.getElementById('score-error');

let match = null; // the latest version of the match from the server

// Build one player's row of the broadcast scoreboard
function boardRow(player, playerNumber, sets) {
  const isWinner = match.winnerId === player.id;
  const isServing = match.server === playerNumber;
  const isLive = match.status === 'in_progress';

  const setBoxes = sets.map((set, i) => {
    const mine = playerNumber === 1 ? set.player1Games : set.player2Games;
    const theirs = playerNumber === 1 ? set.player2Games : set.player1Games;
    // A set is finished if it's not the current one (or the match is over)
    const finished = i < sets.length - 1 || match.status === 'completed';
    const wonSet = finished && mine > theirs;
    return `<span class="bc-set ${finished ? (wonSet ? 'won' : 'lost') : 'current'}">${mine}</span>`;
  }).join('');

  return `
    <div class="bc-row ${isWinner ? 'winner' : ''}">
      <span class="bc-serve ${isServing ? 'on' : ''}" title="${isServing ? 'Serving' : ''}"></span>
      ${flag(player.country)}
      <span class="bc-name">
        ${escapeHtml(player.name)}${isWinner ? ' <span class="bc-check">✓</span>' : ''}
        <small>${escapeHtml(countryIoc(player.country))}</small>
      </span>
      ${setBoxes}
      ${isLive ? `<span class="bc-points">${match.pointLabels[playerNumber - 1]}</span>` : ''}
    </div>
  `;
}

// The strip under the scoreboard: MATCH POINT / SET POINT / BREAK POINT / TIEBREAK / DEUCE / ADVANTAGE
function situationStrip() {
  if (match.status !== 'in_progress') return '';
  const nameOf = (n) => (n === 1 ? match.player1.name : match.player2.name);

  if (match.bigPoint) {
    return `<div class="bc-strip big">${match.bigPoint.type} · ${escapeHtml(nameOf(match.bigPoint.player))}</div>`;
  }
  if (match.tiebreak) return '<div class="bc-strip">Tiebreak</div>';

  const [a, b] = match.pointLabels;
  if (a === '40' && b === '40') return '<div class="bc-strip">Deuce</div>';
  if (a === 'AD') return `<div class="bc-strip">Advantage · ${escapeHtml(nameOf(1))}</div>`;
  if (b === 'AD') return `<div class="bc-strip">Advantage · ${escapeHtml(nameOf(2))}</div>`;
  return '';
}

function showScoreboard() {
  // Before the first point there are no sets yet, so show an empty "0-0" first set
  const sets = match.sets.length ? match.sets : [{ setNumber: 1, player1Games: 0, player2Games: 0 }];

  let status;
  if (match.status === 'scheduled') status = '<span class="badge">Not started</span>';
  else if (match.status === 'in_progress') status = '<span class="badge live">● Live</span>';
  else status = '<span class="badge done">Final</span>';

  document.getElementById('scoreboard').innerHTML = `
    <div class="broadcast">
      <div class="bc-top">
        <span>${escapeHtml(match.round)} · ${escapeHtml(match.court)} · Best of ${match.bestOf}</span>
        ${status}
      </div>
      ${boardRow(match.player1, 1, sets)}
      ${boardRow(match.player2, 2, sets)}
      ${situationStrip()}
    </div>
    <p class="muted bc-time">${formatDate(match.scheduledAt)}</p>
  `;

  // "Who serves first?" is only asked before the first point
  const serveChoice = document.getElementById('serve-choice');
  serveChoice.hidden = match.pointLog !== '' || match.status === 'completed';
  document.getElementById('serve1').textContent = match.player1.name;
  document.getElementById('serve2').textContent = match.player2.name;
  document.getElementById('serve1').classList.toggle('secondary', match.firstServer !== 1);
  document.getElementById('serve2').classList.toggle('secondary', match.firstServer !== 2);

  // Umpire buttons: named after the players, and switched off once the match is over
  controls.hidden = false;
  document.getElementById('point1').textContent = `Point ${match.player1.name}`;
  document.getElementById('point2').textContent = `Point ${match.player2.name}`;
  document.getElementById('point1').disabled = match.status === 'completed';
  document.getElementById('point2').disabled = match.status === 'completed';
  document.getElementById('serve1').disabled = false;
  document.getElementById('serve2').disabled = false;
  document.getElementById('undo').disabled = match.pointLog === '';
}

// Store the newest match from the server and redraw. If the match has *just* finished
// (it was being played a moment ago and now it's over), celebrate!
function updateMatch(newMatch) {
  const justFinished = match && match.status !== 'completed' && newMatch.status === 'completed' && newMatch.winner;
  match = newMatch;
  showScoreboard();
  if (justFinished) confetti();
}

// ---------- Confetti ----------
// Draws ~160 little pieces of paper on a see-through canvas over the page, lets them fall
// for a few seconds, then removes the canvas. No library needed.
function confetti() {
  if (reduceMotion) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const colours = ['#d4f03a', '#ffffff', '#ff4d3d', '#3dd6ff'];
  const pieces = Array.from({ length: 160 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,  // start near the middle...
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 16,                     // ...and burst outwards
    vy: Math.random() * -14 - 4,
    size: Math.random() * 6 + 5,
    spin: Math.random() * Math.PI,
    colour: colours[Math.floor(Math.random() * colours.length)],
  }));

  const start = performance.now();
  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += 0.35;   // gravity pulls it down
      p.vx *= 0.99;   // air slows it a little
      p.x += p.vx;
      p.y += p.vy;
      p.spin += 0.15;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.colour;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (now - start < 4000) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

async function loadMatch() {
  try {
    updateMatch(await api('GET', `/api/matches/${matchId}`));
    revealOnScroll(document.querySelector('main'));
  } catch (err) {
    document.getElementById('scoreboard').innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
    // If the match was deleted, stop asking the server about it every 3 seconds
    if (err.message === 'Match not found') clearInterval(refreshTimer);
  }
}

// Send a point (or an undo) to the server, then show the new score it sends back
async function sendScore(url, body) {
  errorLine.textContent = '';
  // Switch the buttons off while saving, so a fast double-click can't send two points at once
  controls.querySelectorAll('button').forEach((b) => (b.disabled = true));
  try {
    updateMatch(await api('POST', url, body));
  } catch (err) {
    errorLine.textContent = err.message;
    showScoreboard(); // switch the buttons back on
  }
}

document.getElementById('point1').addEventListener('click', () => sendScore(`/api/matches/${matchId}/point`, { player: 1 }));
document.getElementById('point2').addEventListener('click', () => sendScore(`/api/matches/${matchId}/point`, { player: 2 }));
document.getElementById('undo').addEventListener('click', () => sendScore(`/api/matches/${matchId}/undo`));

// Choose who serves first (before the first point)
async function chooseServer(player) {
  errorLine.textContent = '';
  try {
    await api('PUT', `/api/matches/${matchId}`, { firstServer: player });
    await loadMatch();
  } catch (err) {
    errorLine.textContent = err.message;
  }
}
document.getElementById('serve1').addEventListener('click', () => chooseServer(1));
document.getElementById('serve2').addEventListener('click', () => chooseServer(2));

loadMatch();

// Check for new points every 3 seconds, so anyone else watching this page sees the score change
const refreshTimer = setInterval(loadMatch, 3000);

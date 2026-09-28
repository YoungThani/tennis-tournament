// Live score page: a big scoreboard, plus buttons for the umpire to record points.
// The match id comes from the URL, e.g. /score.html?id=7

const matchId = new URLSearchParams(window.location.search).get('id');
const controls = document.getElementById('umpire-controls');
const errorLine = document.getElementById('score-error');

let match = null; // the latest version of the match from the server

// Build the scoreboard HTML: one row per player, one column per set, plus current points
function showScoreboard() {
  const setHeaders = match.sets.map((s) => `<th>Set ${s.setNumber}</th>`).join('');
  const isLive = match.status === 'in_progress';

  function row(player, playerNumber) {
    const games = match.sets.map((s) => `<td class="games">${playerNumber === 1 ? s.player1Games : s.player2Games}</td>`).join('');
    const isWinner = match.winnerId === player.id;
    return `
      <tr class="${isWinner ? 'winner' : ''}">
        <td class="sb-name">
          ${escapeHtml(player.name)}${isWinner ? ' ✓' : ''}
          <span class="muted">${escapeHtml(player.country)}</span>
        </td>
        ${games}
        ${isLive ? `<td class="points">${match.pointLabels[playerNumber - 1]}</td>` : ''}
      </tr>
    `;
  }

  let statusText;
  if (match.status === 'scheduled') {
    statusText = 'Not started. The first point starts the match.';
  } else if (match.status === 'in_progress') {
    statusText = `<span class="badge live">● Live${match.tiebreak ? ' · Tiebreak' : ''}</span>`;
  } else {
    // (a match marked "Final" by hand on the Matches page may have no winner)
    statusText = `<span class="badge done">Final</span> ${match.winner ? escapeHtml(match.winner.name) + ' wins' : ''}`;
  }

  document.getElementById('scoreboard').innerHTML = `
    <div class="card">
      <div class="match-info">
        <span>${escapeHtml(match.round)} · ${escapeHtml(match.court)} · Best of ${match.bestOf}</span>
        <span>${statusText}</span>
      </div>
      <div class="table-wrap">
        <table class="scoreboard">
          <thead>
            <tr><th></th>${setHeaders}${isLive ? '<th>Points</th>' : ''}</tr>
          </thead>
          <tbody>
            ${row(match.player1, 1)}
            ${row(match.player2, 2)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Umpire buttons: named after the players, and switched off once the match is over
  controls.hidden = false;
  document.getElementById('point1').textContent = `Point ${match.player1.name}`;
  document.getElementById('point2').textContent = `Point ${match.player2.name}`;
  document.getElementById('point1').disabled = match.status === 'completed';
  document.getElementById('point2').disabled = match.status === 'completed';
  document.getElementById('undo').disabled = match.pointLog === '';
}

async function loadMatch() {
  try {
    match = await api('GET', `/api/matches/${matchId}`);
    showScoreboard();
  } catch (err) {
    document.getElementById('scoreboard').innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

// Send a point (or an undo) to the server, then show the new score it sends back
async function sendScore(url, body) {
  errorLine.textContent = '';
  // Switch the buttons off while saving, so a fast double-click can't send two points at once
  controls.querySelectorAll('button').forEach((b) => (b.disabled = true));
  try {
    match = await api('POST', url, body);
  } catch (err) {
    errorLine.textContent = err.message;
  }
  showScoreboard(); // also switches the buttons back on
}

document.getElementById('point1').addEventListener('click', () => sendScore(`/api/matches/${matchId}/point`, { player: 1 }));
document.getElementById('point2').addEventListener('click', () => sendScore(`/api/matches/${matchId}/point`, { player: 2 }));
document.getElementById('undo').addEventListener('click', () => sendScore(`/api/matches/${matchId}/undo`));

loadMatch();

// Check for new points every 3 seconds, so anyone else watching this page sees the score change
setInterval(loadMatch, 3000);

// Schedule page: shows live, upcoming and past matches.

// Build the HTML for one player's row inside a match card
function playerRow(player, games, isWinner) {
  const scores = games.map((g) => `<span class="set">${g}</span>`).join('');
  return `
    <div class="player-row ${isWinner ? 'winner' : ''}">
      <span class="player-name">${escapeHtml(player.name)}</span>
      <span class="player-country muted">${escapeHtml(player.country)}</span>
      <span class="sets">${scores}</span>
    </div>
  `;
}

// Build the HTML for one match card
function matchCard(match) {
  const p1Games = match.sets.map((s) => s.player1Games);
  const p2Games = match.sets.map((s) => s.player2Games);

  const badges = {
    in_progress: '<span class="badge live">● Live</span>',
    scheduled: '<span class="badge">Upcoming</span>',
    completed: '<span class="badge done">Final</span>',
  };

  return `
    <div class="card match-card">
      <div class="match-info">
        <span>${escapeHtml(match.round)} · ${escapeHtml(match.court)}</span>
        ${badges[match.status]}
      </div>
      ${playerRow(match.player1, p1Games, match.winnerId === match.player1Id)}
      ${playerRow(match.player2, p2Games, match.winnerId === match.player2Id)}
      <div class="match-time muted">${formatDate(match.scheduledAt)}</div>
    </div>
  `;
}

// Fill one section (e.g. "upcoming") with match cards, or a message if there are none
function showMatches(elementId, matches, emptyMessage) {
  const element = document.getElementById(elementId);
  if (matches.length === 0) {
    element.innerHTML = `<p class="empty">${emptyMessage}</p>`;
  } else {
    element.innerHTML = matches.map(matchCard).join('');
  }
}

async function loadSchedule() {
  try {
    const schedule = await api('GET', '/api/schedule');

    // Only show the "Live now" section when something is being played
    document.getElementById('live-section').hidden = schedule.live.length === 0;

    showMatches('live', schedule.live, '');
    showMatches('upcoming', schedule.upcoming, 'No upcoming matches.');
    showMatches('past', schedule.past, 'No matches played yet.');
  } catch (err) {
    document.getElementById('upcoming').innerHTML = `<p class="error">Could not load the schedule: ${escapeHtml(err.message)}</p>`;
  }
}

loadSchedule();

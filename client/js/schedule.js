// Schedule page: shows live, upcoming and past matches.

// Build the HTML for one player's row inside a match card
// (pointLabel is the current game's score, e.g. "30", only shown for live matches)
function playerRow(player, games, isWinner, pointLabel, isServing) {
  const scores = games.map((g) => `<span class="set">${g}</span>`).join('');
  const points = pointLabel !== undefined ? `<span class="set live-points">${pointLabel}</span>` : '';
  return `
    <div class="player-row ${isWinner ? 'winner' : ''} ${isServing ? 'serving' : ''}">
      <span class="player-name">${escapeHtml(player.name)}</span>
      <span class="player-country muted">${escapeHtml(player.country)}</span>
      <span class="sets">${scores}${points}</span>
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

  // Live matches also show the current game's points
  const live = match.status === 'in_progress';
  const p1Points = live ? match.pointLabels[0] : undefined;
  const p2Points = live ? match.pointLabels[1] : undefined;

  // The whole card is a link to the live score page
  return `
    <a class="card match-card" href="/score.html?id=${match.id}">
      <div class="match-info">
        <span>${escapeHtml(match.round)} · ${escapeHtml(match.court)}</span>
        <span>
          ${live && match.bigPoint ? `<span class="badge big">${match.bigPoint.type}</span>` : ''}
          ${badges[match.status]}
        </span>
      </div>
      ${playerRow(match.player1, p1Games, match.winnerId === match.player1Id, p1Points, live && match.server === 1)}
      ${playerRow(match.player2, p2Games, match.winnerId === match.player2Id, p2Points, live && match.server === 2)}
      <div class="match-time muted">${formatDate(match.scheduledAt)}</div>
    </a>
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

// Refresh every 5 seconds so live scores update on their own
setInterval(loadSchedule, 5000);

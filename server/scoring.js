// Tennis scoring rules. No database or web code here, just the rules,
// so they're easy to test on their own (see scoring.test.js).
//
// A score looks like this:
//   {
//     bestOf: 3,
//     sets: [[6, 4], [2, 1]],  // games in each set: [player 1, player 2]. The last one is the current set.
//     points: [2, 1],          // points in the current game (or tiebreak): [player 1, player 2]
//     winner: null,            // 1 or 2 once the match is over
//   }

function newScore(bestOf) {
  return { bestOf, sets: [[0, 0]], points: [0, 0], winner: null };
}

function currentSet(score) {
  return score.sets[score.sets.length - 1];
}

// At 6-6 in games, the set is decided by a tiebreak
function isTiebreak(score) {
  const [a, b] = currentSet(score);
  return a === 6 && b === 6;
}

// Who won this set? 1, 2, or null if it's not finished.
// A set is won with 6+ games and a 2-game lead (6-4, 7-5), or 7-6 after a tiebreak.
function setWinner([a, b]) {
  if ((a >= 6 && a - b >= 2) || (a === 7 && b === 6)) return 1;
  if ((b >= 6 && b - a >= 2) || (b === 7 && a === 6)) return 2;
  return null;
}

// Give a point to player 1 or 2. Returns a new score (the old one isn't changed).
function addPoint(score, player) {
  if (score.winner) return score; // match already over

  const s = structuredClone(score);
  const me = player - 1;   // array position: player 1 → 0, player 2 → 1
  const them = 1 - me;
  const tiebreak = isTiebreak(s);

  s.points[me] += 1;

  // A game needs 4 points (a tiebreak needs 7), and you must be 2 points ahead.
  // That "2 ahead" rule is what makes deuce and advantage happen.
  const pointsNeeded = tiebreak ? 7 : 4;
  const wonGame = s.points[me] >= pointsNeeded && s.points[me] - s.points[them] >= 2;
  if (!wonGame) return s;

  // Game won: add it to the current set and reset the points
  currentSet(s)[me] += 1;
  s.points = [0, 0];

  if (!setWinner(currentSet(s))) return s;

  // Set won: has this player won enough sets to win the match? (2 of 3, or 3 of 5)
  const setsNeeded = Math.ceil(s.bestOf / 2);
  const setsWon = s.sets.filter((set) => setWinner(set) === player).length;
  if (setsWon === setsNeeded) {
    s.winner = player;
  } else {
    s.sets.push([0, 0]); // start the next set
  }
  return s;
}

// Rebuild the whole score from the list of point winners, e.g. "1121..."
function scoreFromLog(pointLog, bestOf) {
  let score = newScore(bestOf);
  for (const player of pointLog) {
    score = addPoint(score, Number(player));
  }
  return score;
}

// How the current game's points are shown on a scoreboard: ["30", "15"], ["40", "AD"], ...
function pointLabels(score) {
  const [a, b] = score.points;
  if (score.winner) return ['', ''];
  if (isTiebreak(score)) return [String(a), String(b)]; // tiebreaks count 1, 2, 3...

  if (a >= 3 && b >= 3) {
    if (a === b) return ['40', '40'];      // deuce
    return a > b ? ['AD', '40'] : ['40', 'AD'];
  }
  const names = ['0', '15', '30', '40'];
  return [names[a], names[b]];
}

// Add scoreboard info to a match from the database, so the frontend doesn't need to know the rules:
//   pointLabels: ["30", "15"]   tiebreak: false
function withScoreboard(match) {
  const score = scoreFromLog(match.pointLog, match.bestOf);
  return { ...match, pointLabels: pointLabels(score), tiebreak: !score.winner && isTiebreak(score) };
}

module.exports = { newScore, addPoint, scoreFromLog, pointLabels, isTiebreak, setWinner, withScoreboard };

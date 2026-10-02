// Tests for the tennis rules. Run with: npm test
// Uses Node's built-in test runner, so no extra libraries needed.

const test = require('node:test');
const assert = require('node:assert');
const { scoreFromLog, pointLabels, currentServer, bigPoint } = require('./scoring');

// Helper: "1".repeat(4) = player 1 wins 4 points in a row = one game
const game1 = '1111';
const game2 = '2222';

test('points go 0, 15, 30, 40', () => {
  assert.deepStrictEqual(pointLabels(scoreFromLog('', 3)), ['0', '0']);
  assert.deepStrictEqual(pointLabels(scoreFromLog('1', 3)), ['15', '0']);
  assert.deepStrictEqual(pointLabels(scoreFromLog('12', 3)), ['15', '15']);
  assert.deepStrictEqual(pointLabels(scoreFromLog('112', 3)), ['30', '15']);
  assert.deepStrictEqual(pointLabels(scoreFromLog('1112', 3)), ['40', '15']);
});

test('winning 4 points wins the game', () => {
  const score = scoreFromLog(game1, 3);
  assert.deepStrictEqual(score.sets, [[1, 0]]);
  assert.deepStrictEqual(score.points, [0, 0]);
});

test('deuce and advantage', () => {
  const deuce = '111222'; // 40-40
  assert.deepStrictEqual(pointLabels(scoreFromLog(deuce, 3)), ['40', '40']);
  assert.deepStrictEqual(pointLabels(scoreFromLog(deuce + '1', 3)), ['AD', '40']);
  assert.deepStrictEqual(pointLabels(scoreFromLog(deuce + '12', 3)), ['40', '40']); // back to deuce
  assert.deepStrictEqual(pointLabels(scoreFromLog(deuce + '122', 3)), ['40', 'AD']);

  // From advantage, winning the next point wins the game
  const score = scoreFromLog(deuce + '1222', 3);
  assert.deepStrictEqual(score.sets, [[0, 1]]);
});

test('6 games wins a set (with a 2-game lead)', () => {
  const score = scoreFromLog(game1.repeat(6), 3);
  assert.deepStrictEqual(score.sets, [[6, 0], [0, 0]]); // set 2 has started
});

test('at 6-5 the set continues, 7-5 wins it', () => {
  const fiveAll = (game1 + game2).repeat(5);
  assert.deepStrictEqual(scoreFromLog(fiveAll + game1, 3).sets, [[6, 5]]);
  assert.deepStrictEqual(scoreFromLog(fiveAll + game1 + game1, 3).sets, [[7, 5], [0, 0]]);
});

test('tiebreak at 6-6, first to 7 points wins the set 7-6', () => {
  const sixAll = (game1 + game2).repeat(6);
  const inTiebreak = scoreFromLog(sixAll + '111', 3);
  assert.deepStrictEqual(inTiebreak.sets, [[6, 6]]);
  assert.deepStrictEqual(pointLabels(inTiebreak), ['3', '0']); // tiebreak points are 1, 2, 3...

  const done = scoreFromLog(sixAll + '1111111', 3);
  assert.deepStrictEqual(done.sets, [[7, 6], [0, 0]]);
});

test('tiebreak must be won by 2 points (8-6)', () => {
  const sixAll = (game1 + game2).repeat(6);
  const sixSixInTiebreak = '121212121212';
  assert.deepStrictEqual(scoreFromLog(sixAll + sixSixInTiebreak + '1', 3).sets, [[6, 6]]); // 7-6, not enough
  assert.deepStrictEqual(scoreFromLog(sixAll + sixSixInTiebreak + '11', 3).sets, [[7, 6], [0, 0]]); // 8-6 wins
});

test('best of 3: winning 2 sets wins the match', () => {
  const set1 = game1.repeat(6);
  const set2 = game2.repeat(6);
  const score = scoreFromLog(set1 + set2 + set1, 3);
  assert.strictEqual(score.winner, 1);
  assert.deepStrictEqual(score.sets, [[6, 0], [0, 6], [6, 0]]);
});

test('best of 5: needs 3 sets', () => {
  const set1 = game1.repeat(6);
  assert.strictEqual(scoreFromLog(set1 + set1, 5).winner, null);
  assert.strictEqual(scoreFromLog(set1 + set1 + set1, 5).winner, 1);
});

test('points after the match is over are ignored', () => {
  const set2 = game2.repeat(6);
  const score = scoreFromLog(set2 + set2 + '1111', 3);
  assert.strictEqual(score.winner, 2);
  assert.deepStrictEqual(score.sets, [[0, 6], [0, 6]]);
});

// ---------- Serving ----------

test('serve switches every game', () => {
  assert.strictEqual(currentServer(scoreFromLog('', 3, 1)), 1);
  assert.strictEqual(currentServer(scoreFromLog(game1, 3, 1)), 2);
  assert.strictEqual(currentServer(scoreFromLog(game1 + game2, 3, 1)), 1);
  assert.strictEqual(currentServer(scoreFromLog('', 3, 2)), 2); // player 2 can serve first
});

test('tiebreak serve: A, then B B, A A, B B...', () => {
  const sixAll = (game1 + game2).repeat(6); // 12 games, so player 1 serves first in the tiebreak
  const servers = [];
  for (let i = 0; i < 7; i++) {
    servers.push(currentServer(scoreFromLog(sixAll + '1'.repeat(i), 3, 1)));
  }
  assert.deepStrictEqual(servers, [1, 2, 2, 1, 1, 2, 2]);
});

test('after a tiebreak, the player who received first serves', () => {
  const sixAll = (game1 + game2).repeat(6);
  const afterTiebreak = scoreFromLog(sixAll + '1111111', 3, 1); // player 1 served first in the tiebreak
  assert.deepStrictEqual(afterTiebreak.sets, [[7, 6], [0, 0]]);
  assert.strictEqual(currentServer(afterTiebreak), 2);
});

test('no server once the match is over', () => {
  assert.strictEqual(currentServer(scoreFromLog(game1.repeat(12), 3)), null);
});

// ---------- Big points ----------

test('normal point: nothing special', () => {
  assert.strictEqual(bigPoint(scoreFromLog('1', 3)), null);
});

test('break point: the receiver is one point from winning the game', () => {
  // Player 1 serves the first game; player 2 leads 40-0
  assert.deepStrictEqual(bigPoint(scoreFromLog('222', 3, 1)), { type: 'break point', player: 2 });
  // The server leading 40-0 is just a game point, not a big one
  assert.strictEqual(bigPoint(scoreFromLog('111', 3, 1)), null);
});

test('set point', () => {
  const fiveLove = game1.repeat(5); // 5-0 to player 1
  assert.deepStrictEqual(bigPoint(scoreFromLog(fiveLove + '111', 3)), { type: 'set point', player: 1 });
});

test('match point beats set point', () => {
  const firstSet = game1.repeat(6);
  const fiveLove = game1.repeat(5);
  assert.deepStrictEqual(bigPoint(scoreFromLog(firstSet + fiveLove + '111', 3)), { type: 'match point', player: 1 });
});

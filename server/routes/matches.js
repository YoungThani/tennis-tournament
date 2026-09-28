const express = require('express');
const prisma = require('../db');

const router = express.Router();

const STATUSES = ['scheduled', 'in_progress', 'completed'];

// Every time we send a match back, include the players and set scores
const matchDetails = {
  player1: true,
  player2: true,
  winner: true,
  sets: { orderBy: { setNumber: 'asc' } },
};

// Pick only the fields a match is allowed to have from the request body.
// Scores are left out on purpose: live scoring (step 6) will handle those.
function matchData(body) {
  return {
    round: body.round,
    court: body.court,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    status: body.status,
    bestOf: body.bestOf,
    player1Id: body.player1Id,
    player2Id: body.player2Id,
  };
}

// Check the data makes sense. Returns an error message, or null if it's fine.
function checkMatch(data) {
  if (data.status && !STATUSES.includes(data.status)) {
    return `Status must be one of: ${STATUSES.join(', ')}`;
  }
  if (data.scheduledAt && isNaN(data.scheduledAt)) {
    return 'scheduledAt must be a valid date, e.g. "2026-10-05T14:00"';
  }
  if (data.player1Id && data.player1Id === data.player2Id) {
    return 'A player cannot play against themselves';
  }
  return null;
}

// GET /api/matches → list all matches, earliest first
router.get('/', async (req, res) => {
  const matches = await prisma.match.findMany({
    orderBy: { scheduledAt: 'asc' },
    include: matchDetails,
  });
  res.json(matches);
});

// GET /api/matches/:id → one match
router.get('/:id', async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: Number(req.params.id) },
    include: matchDetails,
  });
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json(match);
});

// POST /api/matches → create a match
router.post('/', async (req, res) => {
  const data = matchData(req.body);
  if (!data.player1Id || !data.player2Id || !data.round || !data.court || !data.scheduledAt) {
    return res.status(400).json({ error: 'player1Id, player2Id, round, court and scheduledAt are required' });
  }
  const problem = checkMatch(data);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  try {
    const match = await prisma.match.create({ data, include: matchDetails });
    res.status(201).json(match);
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Player not found' });
    }
    throw err;
  }
});

// PUT /api/matches/:id → update a match (send only the fields you want to change)
router.put('/:id', async (req, res) => {
  const data = matchData(req.body);
  const problem = checkMatch(data);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  try {
    const match = await prisma.match.update({
      where: { id: Number(req.params.id) },
      data,
      include: matchDetails,
    });
    res.json(match);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Player not found' });
    }
    throw err;
  }
});

// DELETE /api/matches/:id → delete a match (its set scores are deleted too)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.match.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    throw err;
  }
});

module.exports = router;

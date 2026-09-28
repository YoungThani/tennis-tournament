const express = require('express');
const prisma = require('../db');

const router = express.Router();

// Pick only the fields a coach is allowed to have from the request body
function coachData(body) {
  return {
    name: body.name,
    country: body.country,
  };
}

// GET /api/coaches → list all coaches with their players
router.get('/', async (req, res) => {
  const coaches = await prisma.coach.findMany({
    orderBy: { name: 'asc' },
    include: { players: true },
  });
  res.json(coaches);
});

// GET /api/coaches/:id → one coach
router.get('/:id', async (req, res) => {
  const coach = await prisma.coach.findUnique({
    where: { id: Number(req.params.id) },
    include: { players: true },
  });
  if (!coach) {
    return res.status(404).json({ error: 'Coach not found' });
  }
  res.json(coach);
});

// POST /api/coaches → create a coach
router.post('/', async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const coach = await prisma.coach.create({ data: coachData(req.body) });
  res.status(201).json(coach);
});

// PUT /api/coaches/:id → update a coach
router.put('/:id', async (req, res) => {
  try {
    const coach = await prisma.coach.update({
      where: { id: Number(req.params.id) },
      data: coachData(req.body),
    });
    res.json(coach);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Coach not found' });
    }
    throw err;
  }
});

// DELETE /api/coaches/:id → delete a coach (their links to players are removed too)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.coach.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Coach not found' });
    }
    throw err;
  }
});

// POST /api/coaches/:id/players/:playerId → link a player to this coach
router.post('/:id/players/:playerId', async (req, res) => {
  try {
    const coach = await prisma.coach.update({
      where: { id: Number(req.params.id) },
      data: { players: { connect: { id: Number(req.params.playerId) } } },
      include: { players: true },
    });
    res.json(coach);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Coach or player not found' });
    }
    throw err;
  }
});

// DELETE /api/coaches/:id/players/:playerId → unlink a player from this coach
router.delete('/:id/players/:playerId', async (req, res) => {
  try {
    const coach = await prisma.coach.update({
      where: { id: Number(req.params.id) },
      data: { players: { disconnect: { id: Number(req.params.playerId) } } },
      include: { players: true },
    });
    res.json(coach);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Coach not found' });
    }
    throw err;
  }
});

module.exports = router;

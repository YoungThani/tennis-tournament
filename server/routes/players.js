const express = require('express');
const prisma = require('../db');

const router = express.Router();

// Pick only the fields a player is allowed to have from the request body,
// so nobody can sneak in things like "id" or "createdAt".
function playerData(body) {
  return {
    name: body.name,
    country: body.country,
    ranking: body.ranking,
    age: body.age,
    plays: body.plays,
  };
}

// GET /api/players → list all players (best ranking first)
router.get('/', async (req, res) => {
  const players = await prisma.player.findMany({
    orderBy: { ranking: { sort: 'asc', nulls: 'last' } }, // unranked players go at the end
    include: { coaches: true },
  });
  res.json(players);
});

// GET /api/players/:id → one player
router.get('/:id', async (req, res) => {
  const player = await prisma.player.findUnique({
    where: { id: Number(req.params.id) },
    include: { coaches: true },
  });
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json(player);
});

// POST /api/players → create a player
router.post('/', async (req, res) => {
  if (!req.body.name || !req.body.country) {
    return res.status(400).json({ error: 'Name and country are required' });
  }
  const player = await prisma.player.create({ data: playerData(req.body) });
  res.status(201).json(player);
});

// PUT /api/players/:id → update a player (send only the fields you want to change)
router.put('/:id', async (req, res) => {
  try {
    const player = await prisma.player.update({
      where: { id: Number(req.params.id) },
      data: playerData(req.body),
    });
    res.json(player);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Player not found' });
    }
    throw err;
  }
});

// DELETE /api/players/:id → delete a player
router.delete('/:id', async (req, res) => {
  try {
    await prisma.player.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Player has matches and cannot be deleted' });
    }
    throw err;
  }
});

module.exports = router;

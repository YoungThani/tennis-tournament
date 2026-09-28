const express = require('express');
const prisma = require('../db');
const { withScoreboard } = require('../scoring');

const router = express.Router();

// Include the players and set scores with every match
const matchDetails = {
  player1: true,
  player2: true,
  winner: true,
  sets: { orderBy: { setNumber: 'asc' } },
};

// GET /api/schedule → matches grouped into live, upcoming and past
router.get('/', async (req, res) => {
  // Being played right now
  const live = await prisma.match.findMany({
    where: { status: 'in_progress' },
    orderBy: { scheduledAt: 'asc' },
    include: matchDetails,
  });

  // Not started yet: soonest first
  const upcoming = await prisma.match.findMany({
    where: { status: 'scheduled' },
    orderBy: { scheduledAt: 'asc' },
    include: matchDetails,
  });

  // Finished: most recent first
  const past = await prisma.match.findMany({
    where: { status: 'completed' },
    orderBy: { scheduledAt: 'desc' },
    include: matchDetails,
  });

  res.json({
    live: live.map(withScoreboard),
    upcoming: upcoming.map(withScoreboard),
    past: past.map(withScoreboard),
  });
});

module.exports = router;

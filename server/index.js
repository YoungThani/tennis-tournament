const express = require('express');
const path = require('path');
const prisma = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Let Express read JSON sent in request bodies (we'll need this from step 3 on)
app.use(express.json());

// Serve the frontend files from the /client folder
app.use(express.static(path.join(__dirname, '..', 'client')));

// Health check: confirms the server is running and can talk to the database
app.get('/api/health', async (req, res) => {
  const players = await prisma.player.count();
  const coaches = await prisma.coach.count();
  const matches = await prisma.match.count();

  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: { players, coaches, matches },
  });
});

// API routes
app.use('/api/players', require('./routes/players'));
app.use('/api/coaches', require('./routes/coaches'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

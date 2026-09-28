const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Let Express read JSON sent in request bodies (we'll need this from step 3 on)
app.use(express.json());

// Serve the frontend files from the /client folder
app.use(express.static(path.join(__dirname, '..', 'client')));

// Health check: a quick way to confirm the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

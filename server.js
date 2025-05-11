require('dotenv').config();
const express   = require('express');
const path      = require('path');
const cors      = require('cors');
const mongoose  = require('mongoose');
const connectDB = require('./config/dbConn');
const seedDB    = require('./config/seedDB');
const statesAPI = require('./routes/states');

const app  = express();
const PORT = process.env.PORT || 3500;

// ─── middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── root endpoint ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/states', statesAPI);

// ─── catch-all 404 ────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  }
  if (req.accepts('json')) {
    return res.status(404).json({ error: '404 Not Found' });
  }
  res.type('txt').send('404 Not Found');
});

// ─── start server IMMEDIATELY ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);

  // then connect to MongoDB and seed (non-blocking as far as clients are concerned)
  connectDB()
    .then(async () => {
      console.log('🗄️ Connected to MongoDB');
      await seedDB();
      console.log('🌱 Seeding complete');
    })
    .catch(err => {
      console.error('Mongo connection error:', err.message);
    });
});

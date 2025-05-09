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

/* ---------- middleware ---------- */
app.use(cors());
app.use(express.json());

/* ---------- static HTML ---------- */
app.use('/', express.static(path.join(__dirname, 'views')));

/* ---------- REST routes ---------- */
app.use('/states', statesAPI);

/* ---------- catch‑all 404 ---------- */
app.all('*', (req, res) => {
  if (req.accepts('html'))
    return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  if (req.accepts('json'))
    return res.status(404).json({ error: '404 Not Found' });
  res.type('txt').send('404 Not Found');
});

/* ---------- start Express immediately ---------- */
app.listen(PORT, () => console.log(`🚀  API running on port ${PORT}`));

/* ---------- connect to MongoDB (non‑blocking) ---------- */
(async () => {
  await connectDB();

  mongoose.connection.once('open', async () => {
    console.log('🗄️  Connected to MongoDB');
    await seedDB();                    // ensure 5 states have ≥3 fun facts
    console.log('🌱  Seed check complete');
  });
})();

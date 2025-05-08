require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const statesRouter = require('./routes/states');

const app = express();
const PORT = process.env.PORT || 3500;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Static homepage
app.use('/', express.static(path.join(__dirname, 'views')));

// API routes
app.use('/states', statesRouter);

// 404 handler
app.all('*', (req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    return res.status(404).json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// Launch server
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

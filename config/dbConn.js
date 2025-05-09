const mongoose = require('mongoose');

async function connectDB () {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser    : true,
      useUnifiedTopology : true
    });
  } catch (err) {
    console.error('Mongo connection error:', err.message);
  }
}

module.exports = connectDB;

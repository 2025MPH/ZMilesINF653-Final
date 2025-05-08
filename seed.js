// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const State = require('./models/State');

// Sample fun facts for five states
const data = [
  {
    stateCode: 'KS',
    funfacts: [
      'Kansas is home to the geographic center of the contiguous United States.',
      'Dodge City is the windiest city in the United States.',
      'White Castle, the first hamburger chain, started in Wichita in 1921.'
    ]
  },
  {
    stateCode: 'MO',
    funfacts: [
      'The ice cream cone was popularized at the 1904 World’s Fair in St. Louis.',
      'Anheuser-Busch brewery in St. Louis is the largest beer-producing plant in the U.S.',
      'Branson has more theatre seats than Broadway.'
    ]
  },
  {
    stateCode: 'OK',
    funfacts: [
      'The parking meter was invented in Oklahoma City in 1935.',
      'Oklahoma has the largest population of Native Americans of any state.',
      'The world’s first shopping cart was introduced in Ardmore in 1937.'
    ]
  },
  {
    stateCode: 'NE',
    funfacts: [
      'Nebraska has more miles of river than any other state.',
      'Kool-Aid was invented in Hastings in 1927.',
      'Nebraska is the only state with a unicameral (single-house) legislature.'
    ]
  },
  {
    stateCode: 'CO',
    funfacts: [
      'Colorado has the highest average elevation of any state.',
      'The world’s first rodeo was held in Deer Trail in 1869.',
      'Denver brews more beer per capita than any other U.S. city.'
    ]
  }
];

(async () => {
  // 1. Connect to MongoDB
  await connectDB();

  try {
    // 2. Clear out existing fun-facts
    await State.deleteMany({});
    
    // 3. Insert our sample fun-facts
    await State.insertMany(data);
    
    console.log('✅ Seed data loaded successfully');
  } catch (err) {
    console.error('❌ Error loading seed data:', err);
  } finally {
    // 4. Close the connection
    mongoose.connection.close();
  }
})();

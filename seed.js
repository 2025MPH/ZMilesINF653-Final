const State = require('../models/State');

/* 3+ fun facts each for the five required states */
const seedData = {
  KS: [
    'Kansas is home to the geographic center of the contiguous United States.',
    'Dodge City is the windiest city in the United States.',
    'White Castle, the first hamburger chain, started in Wichita in 1921.'
  ],
  MO: [
    'The ice cream cone was popularized at the 1904 World’s Fair in St. Louis.',
    'Anheuser‑Busch brewery in St. Louis is the largest beer‑producing plant in the U.S.',
    'Branson has more theatre seats than Broadway.'
  ],
  OK: [
    'The parking meter was invented in Oklahoma City in 1935.',
    'Oklahoma has the largest population of Native Americans of any state.',
    'The world’s first shopping cart was introduced in Ardmore in 1937.'
  ],
  NE: [
    'Nebraska has more miles of river than any other state.',
    'Kool‑Aid was invented in Hastings in 1927.',
    'Nebraska is the only state with a unicameral legislature.'
  ],
  CO: [
    'Colorado has the highest average elevation of any state.',
    'The world’s first rodeo was held in Deer Trail in 1869.',
    'Denver brews more beer per capita than any other U.S. city.'
  ]
};

module.exports = async function seedDB () {
  for (const [code, facts] of Object.entries(seedData)) {
    const doc = await State.findOne({ stateCode: code });

    if (!doc) {
      await State.create({ stateCode: code, funfacts: facts });
    } else if (!doc.funfacts || doc.funfacts.length === 0) {
      doc.funfacts = facts;
      await doc.save();
    }
  }
};

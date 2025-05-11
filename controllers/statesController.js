const State      = require('../models/State');
const statesJSON = require('../statesData.json');

/* ─── Cache the static JSON (no funfacts key here) ─────────────────────────── */
const staticData = {};
statesJSON.forEach(s => {
  staticData[s.code] = { ...s };
});

/* ─── Helper: merge static + dynamic funfacts ──────────────────────────────── */
async function merge(codes) {
  // grab any documents that exist in Mongo
  const docs = await State.find({ stateCode: { $in: codes } }).lean();
  const map  = Object.fromEntries(docs.map(d => [d.stateCode, d.funfacts]));
  // build each result
  return codes.map(code => {
    const entry = { ...staticData[code] };
    if (map[code] && map[code].length) {
      // only attach funfacts if at least one exists
      entry.funfacts = map[code];
    }
    return entry;
  });
}

/* ─── GET /states ───────────────────────────────────────────────────────────── */
exports.getAllStates = async (req, res) => {
  let codes = Object.keys(staticData);
  if (req.query.contig === 'true')  codes = codes.filter(c => !['AK','HI'].includes(c));
  if (req.query.contig === 'false') codes = codes.filter(c =>  ['AK','HI'].includes(c));
  res.json(await merge(codes));
};

/* ─── GET /states/:state ───────────────────────────────────────────────────── */
exports.getState = async (req, res) => {
  const [result] = await merge([req.stateCode]);
  res.json(result);
};

/* ─── GET /states/:state/funfact ───────────────────────────────────────────── */
exports.getRandomFunFact = async (req, res) => {
  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${staticData[req.stateCode].state}` });
  }
  const idx = Math.floor(Math.random() * doc.funfacts.length);
  res.json({ funfact: doc.funfacts[idx] });
};

/* ─── POST /states/:state/funfact ──────────────────────────────────────────── */
exports.createFunFacts = async (req, res) => {
  const { funfacts } = req.body;
  if (funfacts === undefined) {
    return res.status(400).json({ message: 'State fun facts value required' });
  }
  if (!Array.isArray(funfacts)) {
    return res.status(400).json({ message: 'State fun facts value must be an array' });
  }
  if (funfacts.length === 0) {
    return res.status(400).json({ message: 'State fun facts value required' });
  }
  const doc = await State.findOneAndUpdate(
    { stateCode: req.stateCode },
    { $push: { funfacts: { $each: funfacts } } },
    { new: true, upsert: true }
  );
  res.json(doc);
};

/* ─── PATCH /states/:state/funfact ─────────────────────────────────────────── */
exports.updateFunFact = async (req, res) => {
  const idx     = req.body.index;
  const funfact = req.body.funfact;
  if (!idx)     return res.status(400).json({ message: 'State fun fact index value required' });
  if (!funfact) return res.status(400).json({ message: 'State fun fact value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${staticData[req.stateCode].state}` });
  }
  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${staticData[req.stateCode].state}` });
  }
  doc.funfacts[i] = funfact;
  await doc.save();
  res.json(doc);
};

/* ─── DELETE /states/:state/funfact ───────────────────────────────────────── */
exports.deleteFunFact = async (req, res) => {
  const idx = req.body.index;
  if (!idx) return res.status(400).json({ message: 'State fun fact index value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${staticData[req.stateCode].state}` });
  }
  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${staticData[req.stateCode].state}` });
  }
  doc.funfacts.splice(i, 1);
  await doc.save();
  res.json(doc);
};

/* ─── Simple-field helpers (capital, nickname, population, admission) ─────── */
const simple = (field, label) => async (req, res) => {
  const obj = staticData[req.stateCode];
  res.json({ state: obj.state, [label]: obj[field] });
};

exports.getCapital    = simple('capital_city', 'capital');
exports.getNickname   = simple('nickname',     'nickname');
exports.getPopulation = async (req, res) => {
  const obj = staticData[req.stateCode];
  res.json({ state: obj.state, population: obj.population.toLocaleString('en-US') });
};
exports.getAdmission  = simple('admission_date', 'admitted');

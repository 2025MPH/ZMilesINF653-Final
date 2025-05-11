const State      = require('../models/State');
const statesJSON = require('../statesData.json');

// ─── cache static JSON + ensure every object has a funfacts key ─────────────
const byCode = {};
statesJSON.forEach(s => {
  byCode[s.code] = { ...s, funfacts: undefined };
});

// ─── helper: merge static JSON with Mongo funfacts ─────────────────────────────
async function merge(codes) {
  const docs = await State.find({ stateCode: { $in: codes } }).lean();
  const map  = Object.fromEntries(docs.map(d => [d.stateCode, d.funfacts]));
  return codes.map(c => {
    const obj = { ...byCode[c] };
    if (map[c] && map[c].length) obj.funfacts = map[c];
    return obj;
  });
}

// ─── GET /states ───────────────────────────────────────────────────────────────
exports.getAllStates = async (req, res) => {
  let codes = Object.keys(byCode);
  if (req.query.contig === 'true')  codes = codes.filter(c => !['AK','HI'].includes(c));
  if (req.query.contig === 'false') codes = codes.filter(c =>  ['AK','HI'].includes(c));
  res.json(await merge(codes));
};

// ─── GET /states/:state ───────────────────────────────────────────────────────
exports.getState = async (req, res) => {
  const [obj] = await merge([req.stateCode]);
  res.json(obj);
};

// ─── GET /states/:state/funfact ───────────────────────────────────────────────
exports.getRandomFunFact = async (req, res) => {
  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts || doc.funfacts.length === 0) {
    return res.json({ message: `No Fun Facts found for ${byCode[req.stateCode].state}` });
  }
  const rand = Math.floor(Math.random() * doc.funfacts.length);
  res.json({ funfact: doc.funfacts[rand] });
};

// ─── POST /states/:state/funfact ──────────────────────────────────────────────
exports.createFunFacts = async (req, res) => {
  const { funfacts } = req.body;

  // 1) missing property entirely
  if (funfacts === undefined) {
    return res.status(400).json({ message: 'State fun facts value required' });
  }
  // 2) not an array
  if (!Array.isArray(funfacts)) {
    return res.status(400).json({ message: 'State fun facts value must be an array' });
  }
  // 3) empty array
  if (funfacts.length === 0) {
    return res.status(400).json({ message: 'State fun facts value required' });
  }

  // 4) append them (never overwrite existing)
  const doc = await State.findOneAndUpdate(
    { stateCode: req.stateCode },
    { $push: { funfacts: { $each: funfacts } } },
    { new: true, upsert: true }
  );
  res.json(doc);
};

// ─── PATCH /states/:state/funfact ─────────────────────────────────────────────
exports.updateFunFact = async (req, res) => {
  const idx     = req.body.index;
  const funfact = req.body.funfact;
  if (!idx)     return res.status(400).json({ message: 'State fun fact index value required' });
  if (!funfact) return res.status(400).json({ message: 'State fun fact value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${byCode[req.stateCode].state}` });
  }

  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${byCode[req.stateCode].state}` });
  }

  doc.funfacts[i] = funfact;
  await doc.save();
  res.json(doc);
};

// ─── DELETE /states/:state/funfact ────────────────────────────────────────────
exports.deleteFunFact = async (req, res) => {
  const idx = req.body.index;
  if (!idx) return res.status(400).json({ message: 'State fun fact index value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${byCode[req.stateCode].state}` });
  }

  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${byCode[req.stateCode].state}` });
  }

  doc.funfacts.splice(i, 1);
  await doc.save();
  res.json(doc);
};

// ─── simple-field helpers ────────────────────────────────────────────────────
const simple = (field, label) => async (req, res) => {
  const obj = byCode[req.stateCode];
  res.json({ state: obj.state, [label]: obj[field] });
};

exports.getCapital    = simple('capital_city', 'capital');
exports.getNickname   = simple('nickname',     'nickname');
exports.getPopulation = async (req, res) => {
  const obj = byCode[req.stateCode];
  res.json({ state: obj.state, population: obj.population.toLocaleString('en-US') });
};
exports.getAdmission  = simple('admission_date', 'admitted');

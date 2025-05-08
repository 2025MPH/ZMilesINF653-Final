const State      = require('../models/State');
const statesJSON = require('../statesData.json');

/* ---------- helpers ---------- */
const base = {};                                 // cache static JSON
statesJSON.forEach(s => (base[s.code] = { ...s }));

/* return merged objects (static JSON + funfacts from Mongo) */
const merge = async (codes) => {
  const docs = await State.find({ stateCode: { $in: codes } }).lean();
  const map  = Object.fromEntries(docs.map(d => [d.stateCode, d.funfacts]));
  return codes.map(c => {
    const full = { ...base[c] };
    if (map[c] && map[c].length) full.funfacts = map[c];
    return full;
  });
};

/* ---------- /states ---------- */
exports.getAllStates = async (req, res) => {
  let codes = Object.keys(base);

  if (req.query.contig === 'true')  codes = codes.filter(c => !['AK', 'HI'].includes(c));
  if (req.query.contig === 'false') codes = codes.filter(c =>  ['AK', 'HI'].includes(c));

  const list = await merge(codes);
  res.json(list);
};

/* ---------- /states/:state ---------- */
exports.getState = async (req, res) => {
  const [obj] = await merge([req.stateCode]);
  res.json(obj);
};

/* ---------- /states/:state/funfact (GET) ---------- */
exports.getRandomFunFact = async (req, res) => {
  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts || doc.funfacts.length === 0) {
    return res.json({ message: `No Fun Facts found for ${base[req.stateCode].state}` });
  }
  const rand = Math.floor(Math.random() * doc.funfacts.length);
  res.json({ funfact: doc.funfacts[rand] });
};

/* ---------- /states/:state/funfact (POST) ---------- */
exports.createFunFacts = async (req, res) => {
  const { funfacts } = req.body;

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

/* ---------- /states/:state/funfact (PATCH) ---------- */
exports.updateFunFact = async (req, res) => {
  const idx     = req.body.index;
  const funfact = req.body.funfact;

  if (!idx)     return res.status(400).json({ message: 'State fun fact index value required' });
  if (!funfact) return res.status(400).json({ message: 'State fun fact value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${base[req.stateCode].state}` });
  }

  const i = idx - 1;  // 1‑based → 0‑based
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${base[req.stateCode].state}` });
  }

  doc.funfacts[i] = funfact;
  await doc.save();
  res.json(doc);
};

/* ---------- /states/:state/funfact (DELETE) ---------- */
exports.deleteFunFact = async (req, res) => {
  const idx = req.body.index;
  if (!idx) return res.status(400).json({ message: 'State fun fact index value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${base[req.stateCode].state}` });
  }

  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${base[req.stateCode].state}` });
  }

  doc.funfacts.splice(i, 1);
  await doc.save();
  res.json(doc);
};

/* ---------- simple field endpoints ---------- */
const simple = (field, label) => async (req, res) => {
  const obj = base[req.stateCode];
  res.json({ state: obj.state, [label]: obj[field] });
};

exports.getCapital   = simple('capital_city', 'capital');
exports.getNickname  = simple('nickname',     'nickname');

/* population needs comma formatting */
exports.getPopulation = async (req, res) => {
  const obj = base[req.stateCode];
  const formatted = obj.population.toLocaleString('en-US');
  res.json({ state: obj.state, population: formatted });
};

exports.getAdmission = simple('admission_date', 'admitted');

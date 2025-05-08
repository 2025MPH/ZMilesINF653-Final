const State       = require('../models/State');
const statesJSON  = require('../statesData.json');

/* -------- helpers -------- */
const base   = {};          // in‑memory cache of 50 states keyed by code
statesJSON.forEach(s => (base[s.code] = { ...s }));   // deep copy once

const ensureFunfactsKey = (obj) => {
  if (!Object.prototype.hasOwnProperty.call(obj, 'funfacts')) obj.funfacts = undefined;
};

/* merge static JSON with Mongo fun facts */
const merge = async (codes) => {
  const docs = await State.find({ stateCode: { $in: codes } }).lean();
  const map  = Object.fromEntries(docs.map(d => [d.stateCode, d.funfacts]));
  return codes.map(c => {
    const full = { ...base[c] };
    if (map[c]) full.funfacts = map[c];
    return full;
  });
};

/* -------- GET /states -------- */
exports.getAllStates = async (req, res) => {
  let codes = Object.keys(base);

  if (req.query.contig === 'true')  codes = codes.filter(c => !['AK','HI'].includes(c));
  if (req.query.contig === 'false') codes = codes.filter(c =>  ['AK','HI'].includes(c));

  const list = await merge(codes);
  res.json(list);
};

/* -------- GET /states/:state -------- */
exports.getState = async (req, res) => {
  const [obj] = await merge([req.stateCode]);
  res.json(obj);
};

/* -------- GET /states/:state/funfact -------- */
exports.getRandomFunFact = async (req, res) => {
  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${base[req.stateCode].state}` });
  }
  const rand = Math.floor(Math.random() * doc.funfacts.length);
  res.json({ funfact: doc.funfacts[rand] });
};

/* -------- POST /states/:state/funfact -------- */
exports.createFunFacts = async (req, res) => {
  const { funfacts } = req.body;
  if (!Array.isArray(funfacts) || !funfacts.length) {
    return res.status(400).json({ message: 'State fun facts value must be an array' });
  }

  const doc = await State.findOneAndUpdate(
    { stateCode: req.stateCode },
    { $push: { funfacts: { $each: funfacts } } },
    { new: true, upsert: true }
  );
  res.json(doc);
};

/* -------- PATCH /states/:state/funfact -------- */
exports.updateFunFact = async (req, res) => {
  const idx      = req.body.index;
  const funfact  = req.body.funfact;

  if (!idx)      return res.status(400).json({ message: 'State fun fact index value required' });
  if (!funfact)  return res.status(400).json({ message: 'State fun fact value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${base[req.stateCode].state}` });
  }

  const i = idx - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${base[req.stateCode].state}` });
  }
  doc.funfacts[i] = funfact;
  await doc.save();
  res.json(doc);
};

/* -------- DELETE /states/:state/funfact -------- */
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

/* -------- simple‑field generators -------- */
const simple = (field, label) => async (req, res) => {
  const obj = base[req.stateCode];
  res.json({ state: obj.state, [label]: obj[field] });
};

exports.getCapital     = simple('capital_city', 'capital');
exports.getNickname    = simple('nickname', 'nickname');
exports.getPopulation  = simple('population', 'population');
exports.getAdmission   = simple('admission_date', 'admitted');

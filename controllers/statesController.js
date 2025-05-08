const State = require('../models/State');
const statesData = require('../statesData.json');

const mergeFunFacts = async (statesArr) => {
  const docs = await State.find();
  return statesArr.map(st => {
    const doc = docs.find(d => d.stateCode === st.code);
    return doc ? { ...st, funfacts: doc.funfacts } : st;
  });
};

const getStateData = (code) => statesData.find(s => s.code === code);

// GET /states
const getAllStates = async (req, res) => {
  let result = statesData;
  const { contig } = req.query;
  if (contig === 'true') {
    result = result.filter(s => !['AK', 'HI'].includes(s.code));
  } else if (contig === 'false') {
    result = result.filter(s => ['AK', 'HI'].includes(s.code));
  }
  result = await mergeFunFacts(result);
  res.json(result);
};

// GET /states/:state
const getState = async (req, res) => {
  const stateData = getStateData(req.stateCode);
  if (!stateData) return res.status(404).json({ message: 'State not found' });
  const [merged] = await mergeFunFacts([stateData]);
  res.json(merged);
};

// GET /states/:state/funfact
const getRandomFunFact = async (req, res) => {
  const doc = await State.findOne({ stateCode: req.stateCode });
  const stateName = getStateData(req.stateCode).state;
  if (!doc || !doc.funfacts?.length) {
    return res.json({ message: `No Fun Facts found for ${stateName}` });
  }
  const randomIndex = Math.floor(Math.random() * doc.funfacts.length);
  res.json({ funfact: doc.funfacts[randomIndex] });
};

// POST /states/:state/funfact
const createFunFacts = async (req, res) => {
  const { funfacts } = req.body;
  if (!funfacts) return res.status(400).json({ message: 'State fun facts value required' });
  if (!Array.isArray(funfacts)) return res.status(400).json({ message: 'State fun facts value must be an array' });

  const existing = await State.findOne({ stateCode: req.stateCode });
  if (existing) {
    existing.funfacts = existing.funfacts ? existing.funfacts.concat(funfacts) : funfacts;
    const result = await existing.save();
    return res.json(result);
  }
  const created = await State.create({ stateCode: req.stateCode, funfacts });
  res.json(created);
};

// PATCH /states/:state/funfact
const updateFunFact = async (req, res) => {
  const { index, funfact } = req.body;
  if (!index) return res.status(400).json({ message: 'State fun fact index value required' });
  if (!funfact) return res.status(400).json({ message: 'State fun fact value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  const stateName = getStateData(req.stateCode).state;
  if (!doc || !doc.funfacts?.length) {
    return res.status(404).json({ message: `No Fun Facts found for ${stateName}` });
  }
  const i = index - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}` });
  }
  doc.funfacts[i] = funfact;
  const result = await doc.save();
  res.json(result);
};

// DELETE /states/:state/funfact
const deleteFunFact = async (req, res) => {
  const { index } = req.body;
  if (!index) return res.status(400).json({ message: 'State fun fact index value required' });

  const doc = await State.findOne({ stateCode: req.stateCode });
  const stateName = getStateData(req.stateCode).state;
  if (!doc || !doc.funfacts?.length) {
    return res.status(404).json({ message: `No Fun Facts found for ${stateName}` });
  }
  const i = index - 1;
  if (i < 0 || i >= doc.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}` });
  }
  doc.funfacts.splice(i, 1);
  const result = await doc.save();
  res.json(result);
};

const getSimpleField = (field, label) => async (req, res) => {
  const st = getStateData(req.stateCode);
  res.json({ state: st.state, [label]: st[field] });
};

module.exports = {
  getAllStates,
  getState,
  getRandomFunFact,
  createFunFacts,
  updateFunFact,
  deleteFunFact,
  getCapital: getSimpleField('capital_city', 'capital'),
  getNickname: getSimpleField('nickname', 'nickname'),
  getPopulation: getSimpleField('population', 'population'),
  getAdmission: getSimpleField('admission_date', 'admitted')
};

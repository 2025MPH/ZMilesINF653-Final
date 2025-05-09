const states = require('../statesData.json');
const valid  = new Set(states.map(s => s.code));

module.exports = (req, res, next) => {
  const code = (req.params.state || '').toUpperCase();
  if (!valid.has(code)) {
    return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
  }
  req.stateCode = code;
  next();
};

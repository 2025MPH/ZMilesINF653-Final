const statesData = require('../statesData.json');
const validCodes = new Set(statesData.map(s => s.code));   // O(1) look‑ups

module.exports = (req, res, next) => {
  const code = (req.params.state || '').toUpperCase();
  if (!validCodes.has(code)) {
    return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
  }
  req.stateCode = code;      // attach once, use everywhere
  next();
};

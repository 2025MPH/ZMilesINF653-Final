const statesData = require('../statesData.json');
const validCodes = statesData.map(s => s.code);

const verifyStates = (req, res, next) => {
  const stateParam = req.params.state;
  if (!stateParam) {
    return res.status(400).json({ message: 'State abbreviation required' });
  }
  const code = stateParam.toUpperCase();
  if (!validCodes.includes(code)) {
    return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
  }
  req.stateCode = code;
  next();
};

module.exports = verifyStates;

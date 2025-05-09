const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  stateCode : { type: String, required: true, unique: true, uppercase: true, minlength: 2, maxlength: 2 },
  funfacts  : [String]
});

module.exports = mongoose.model('State', stateSchema);

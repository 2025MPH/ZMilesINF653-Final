const express = require('express');
const router = express.Router();
const verifyStates = require('../middleware/verifyStates');
const ctrl = require('../controllers/statesController');

router.route('/')
  .get(ctrl.getAllStates);

router.route('/:state')
  .get(verifyStates, ctrl.getState);

router.route('/:state/funfact')
  .get(verifyStates, ctrl.getRandomFunFact)
  .post(verifyStates, ctrl.createFunFacts)
  .patch(verifyStates, ctrl.updateFunFact)
  .delete(verifyStates, ctrl.deleteFunFact);

router.get('/:state/capital', verifyStates, ctrl.getCapital);
router.get('/:state/nickname', verifyStates, ctrl.getNickname);
router.get('/:state/population', verifyStates, ctrl.getPopulation);
router.get('/:state/admission', verifyStates, ctrl.getAdmission);

module.exports = router;

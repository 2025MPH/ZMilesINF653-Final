const router = require('express').Router();
const v  = require('../middleware/verifyStates');
const c  = require('../controllers/statesController');

router.route('/').get(c.getAllStates);

router.param('state', v);           // apply verifyStates to every route with :state

router.route('/:state')
  .get(c.getState);

router.route('/:state/funfact')
  .get(c.getRandomFunFact)
  .post(c.createFunFacts)
  .patch(c.updateFunFact)
  .delete(c.deleteFunFact);

router.get('/:state/capital',    c.getCapital);
router.get('/:state/nickname',   c.getNickname);
router.get('/:state/population', c.getPopulation);
router.get('/:state/admission',  c.getAdmission);

module.exports = router;

const express = require('express');
const router  = express.Router();
const verifyStates      = require('../middleware/verifyStates');
const statesController  = require('../controllers/statesController');

/* GET /states */
router.get('/', statesController.getAllStates);

/* All routes below require a valid :state param */
router.use('/:state', verifyStates);

/* GET /states/:state */
router.get('/:state', statesController.getState);

/* GET/POST/PATCH/DELETE /states/:state/funfact */
router
  .route('/:state/funfact')
  .get   (statesController.getRandomFunFact)
  .post  (statesController.createFunFacts)
  .patch (statesController.updateFunFact)
  .delete(statesController.deleteFunFact);

/* Simple field endpoints */
router.get('/:state/capital',    statesController.getCapital);
router.get('/:state/nickname',   statesController.getNickname);
router.get('/:state/population', statesController.getPopulation);
router.get('/:state/admission',  statesController.getAdmission);

module.exports = router;

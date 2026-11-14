const express = require('express');
const cinemaController = require('../controllers/cinema.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createCinemaSchema, createHallSchema } = require('../validators/cinema.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', cinemaController.listCinemas);
router.get('/:cinemaId', cinemaController.getCinemaById);
router.get('/:cinemaId/halls', cinemaController.listHallsByCinemaId);

// Admin-only cinema and hall creation
router.post('/', authenticate, authorize('ADMIN'), validate(createCinemaSchema), cinemaController.createCinema);
router.post('/:cinemaId/halls', authenticate, authorize('ADMIN'), validate(createHallSchema), cinemaController.createHall);

module.exports = router;


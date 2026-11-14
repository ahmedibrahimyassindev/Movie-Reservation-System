const express = require('express');
const reservationController = require('../controllers/reservation.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createReservationSchema } = require('../validators/reservation.validator');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createReservationSchema), reservationController.createReservation);
router.get('/me', reservationController.getMyReservations);
router.get('/:reservationId', reservationController.getReservationById);
router.patch('/:reservationId/cancel', reservationController.cancelReservation);

module.exports = router;


const express = require('express');
const showtimeController = require('../controllers/showtime.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createShowtimeSchema, updateShowtimeSchema } = require('../validators/showtime.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', showtimeController.listShowtimes);
router.get('/:showtimeId', showtimeController.getShowtimeById);
router.get('/:showtimeId/seats', showtimeController.getShowtimeSeats);

// Admin-only showtime CRUD
router.post('/', authenticate, authorize('ADMIN'), validate(createShowtimeSchema), showtimeController.createShowtime);
router.patch('/:showtimeId', authenticate, authorize('ADMIN'), validate(updateShowtimeSchema), showtimeController.updateShowtime);
router.delete('/:showtimeId', authenticate, authorize('ADMIN'), showtimeController.deleteShowtime);

module.exports = router;


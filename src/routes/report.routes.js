const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/reservations', reportController.getReservationSummary);
router.get('/showtimes/:showtimeId', reportController.getShowtimeOccupancy);
router.get('/revenue', reportController.getRevenueReport);

module.exports = router;


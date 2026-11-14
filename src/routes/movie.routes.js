const express = require('express');
const movieController = require('../controllers/movie.controller');
const showtimeController = require('../controllers/showtime.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createMovieSchema, updateMovieSchema } = require('../validators/movie.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', movieController.listMovies);
router.get('/:movieId', movieController.getMovieById);
router.get('/:movieId/showtimes', showtimeController.listShowtimesByMovie);

// Admin-only management routes
router.post('/', authenticate, authorize('ADMIN'), validate(createMovieSchema), movieController.createMovie);
router.patch('/:movieId', authenticate, authorize('ADMIN'), validate(updateMovieSchema), movieController.updateMovie);
router.delete('/:movieId', authenticate, authorize('ADMIN'), movieController.deleteMovie);

module.exports = router;


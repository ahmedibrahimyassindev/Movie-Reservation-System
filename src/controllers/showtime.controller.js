const showtimeService = require('../services/showtime.service');
const { successResponse } = require('../utils/response');

async function listShowtimes(req, res, next) {
  try {
    const showtimes = await showtimeService.listShowtimes(req.query);
    return successResponse(res, showtimes, 200);
  } catch (error) {
    next(error);
  }
}

async function listShowtimesByMovie(req, res, next) {
  try {
    const showtimes = await showtimeService.listShowtimes({
      ...req.query,
      movieId: req.params.movieId,
    });
    return successResponse(res, showtimes, 200);
  } catch (error) {
    next(error);
  }
}

async function getShowtimeById(req, res, next) {
  try {
    const showtime = await showtimeService.getShowtimeById(req.params.showtimeId);
    return successResponse(res, showtime, 200);
  } catch (error) {
    next(error);
  }
}

async function createShowtime(req, res, next) {
  try {
    const showtime = await showtimeService.createShowtime(req.body);
    return successResponse(res, showtime, 201, 'Showtime created successfully');
  } catch (error) {
    next(error);
  }
}

async function updateShowtime(req, res, next) {
  try {
    const showtime = await showtimeService.updateShowtime(req.params.showtimeId, req.body);
    return successResponse(res, showtime, 200, 'Showtime updated successfully');
  } catch (error) {
    next(error);
  }
}

async function deleteShowtime(req, res, next) {
  try {
    await showtimeService.deleteShowtime(req.params.showtimeId);
    return successResponse(res, null, 200, 'Showtime deleted successfully');
  } catch (error) {
    next(error);
  }
}

async function getShowtimeSeats(req, res, next) {
  try {
    const seatsData = await showtimeService.getShowtimeSeats(req.params.showtimeId);
    return successResponse(res, seatsData, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listShowtimes,
  listShowtimesByMovie,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimeSeats,
};


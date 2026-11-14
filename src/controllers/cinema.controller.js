const cinemaService = require('../services/cinema.service');
const { successResponse } = require('../utils/response');

async function listCinemas(req, res, next) {
  try {
    const cinemas = await cinemaService.listCinemas();
    return successResponse(res, cinemas, 200);
  } catch (error) {
    next(error);
  }
}

async function getCinemaById(req, res, next) {
  try {
    const cinema = await cinemaService.getCinemaById(req.params.cinemaId);
    return successResponse(res, cinema, 200);
  } catch (error) {
    next(error);
  }
}

async function createCinema(req, res, next) {
  try {
    const cinema = await cinemaService.createCinema(req.body);
    return successResponse(res, cinema, 201, 'Cinema created successfully');
  } catch (error) {
    next(error);
  }
}

async function listHallsByCinemaId(req, res, next) {
  try {
    const halls = await cinemaService.listHallsByCinemaId(req.params.cinemaId);
    return successResponse(res, halls, 200);
  } catch (error) {
    next(error);
  }
}

async function createHall(req, res, next) {
  try {
    const hall = await cinemaService.createHall(req.params.cinemaId, req.body);
    return successResponse(res, hall, 201, 'Hall created with seats successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCinemas,
  getCinemaById,
  createCinema,
  listHallsByCinemaId,
  createHall,
};


const movieService = require('../services/movie.service');
const { successResponse } = require('../utils/response');

async function listMovies(req, res, next) {
  try {
    const movies = await movieService.listMovies(req.query);
    return successResponse(res, movies, 200);
  } catch (error) {
    next(error);
  }
}

async function getMovieById(req, res, next) {
  try {
    const movie = await movieService.getMovieById(req.params.movieId);
    return successResponse(res, movie, 200);
  } catch (error) {
    next(error);
  }
}

async function createMovie(req, res, next) {
  try {
    const movie = await movieService.createMovie(req.body);
    return successResponse(res, movie, 201, 'Movie created successfully');
  } catch (error) {
    next(error);
  }
}

async function updateMovie(req, res, next) {
  try {
    const movie = await movieService.updateMovie(req.params.movieId, req.body);
    return successResponse(res, movie, 200, 'Movie updated successfully');
  } catch (error) {
    next(error);
  }
}

async function deleteMovie(req, res, next) {
  try {
    await movieService.deleteMovie(req.params.movieId);
    return successResponse(res, null, 200, 'Movie deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};


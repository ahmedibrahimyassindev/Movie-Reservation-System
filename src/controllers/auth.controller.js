const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, result, 201, 'User registered successfully');
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, result, 200, 'Login successful');
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return successResponse(res, user, 200);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
};


function successResponse(res, data, statusCode = 200, message = null) {
  const payload = {
    status: 'success',
  };
  if (message) payload.message = message;
  if (data !== undefined && data !== null) payload.data = data;

  return res.status(statusCode).json(payload);
}

function errorResponse(res, message, statusCode = 500, errors = null) {
  const payload = {
    status: 'error',
    message,
  };
  if (errors) payload.errors = errors;

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};


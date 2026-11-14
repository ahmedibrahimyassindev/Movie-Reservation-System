const { errorResponse } = require('../utils/response');

function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 'Validation failed', 400, formattedErrors);
      }
      return errorResponse(res, 'Invalid request data', 400);
    }
  };
}

module.exports = { validate };


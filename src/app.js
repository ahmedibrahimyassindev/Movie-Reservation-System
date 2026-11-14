const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { errorResponse } = require('./utils/response');

const app = express();

// Security and utility middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Swagger API Documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Movie Reservation System API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Central error handler
app.use(errorHandler);

module.exports = app;


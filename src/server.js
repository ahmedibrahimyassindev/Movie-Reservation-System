const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`🎬 Movie Reservation API running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await config.prisma.$disconnect();
    console.log('HTTP server closed');
  });
});


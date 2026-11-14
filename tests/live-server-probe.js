const app = require('../src/app');
const { prisma } = require('../src/config');

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`🚀 HTTP server started on http://localhost:${port}`);
  try {
    const healthRes = await fetch(`http://localhost:${port}/api/health`);
    const healthData = await healthRes.json();
    console.log('GET /api/health -> Status:', healthRes.status, healthData);

    const docsRes = await fetch(`http://localhost:${port}/api/docs/`);
    console.log('GET /api/docs/ (Swagger) -> Status:', docsRes.status);

    const moviesRes = await fetch(`http://localhost:${port}/api/movies`);
    const moviesData = await moviesRes.json();
    console.log('GET /api/movies -> Status:', moviesRes.status);
    console.log('Live movies from Neon:', moviesData.data.map((m) => m.title));
  } catch (error) {
    console.error('Probe failed:', error);
  } finally {
    await prisma.$disconnect();
    server.close(() => {
      console.log('🛑 Server gracefully closed');
      process.exit(0);
    });
  }
});

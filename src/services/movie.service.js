const { prisma } = require('../config');

async function listMovies(query = {}) {
  const { genre, search } = query;
  const where = {};

  if (genre) {
    where.genre = {
      equals: genre,
      mode: 'insensitive',
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.movie.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

async function getMovieById(id) {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      showtimes: {
        where: {
          startsAt: { gte: new Date() },
        },
        include: {
          hall: {
            include: {
              cinema: true,
            },
          },
        },
        orderBy: { startsAt: 'asc' },
      },
    },
  });

  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }

  return movie;
}

async function createMovie(data) {
  return prisma.movie.create({
    data: {
      ...data,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
    },
  });
}

async function updateMovie(id, data) {
  await getMovieById(id);

  return prisma.movie.update({
    where: { id },
    data: {
      ...data,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
    },
  });
}

async function deleteMovie(id) {
  await getMovieById(id);

  return prisma.movie.delete({
    where: { id },
  });
}

module.exports = {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};


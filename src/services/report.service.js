const { prisma } = require('../config');

async function getReservationSummary() {
  const [totalReservations, confirmedCount, cancelledCount, revenueAggregate] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
    prisma.reservation.count({ where: { status: 'CANCELLED' } }),
    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'CONFIRMED' },
    }),
  ]);

  return {
    totalReservations,
    confirmedReservations: confirmedCount,
    cancelledReservations: cancelledCount,
    totalRevenue: revenueAggregate._sum.totalAmount || 0,
  };
}

async function getShowtimeOccupancy(showtimeId) {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: {
      movie: { select: { title: true } },
      hall: {
        include: {
          cinema: { select: { name: true } },
          _count: { select: { seats: true } },
        },
      },
      reservationSeats: {
        where: { status: 'CONFIRMED' },
      },
    },
  });

  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  const totalSeats = showtime.hall._count.seats;
  const bookedSeats = showtime.reservationSeats.length;
  const occupancyRate = totalSeats > 0 ? Number(((bookedSeats / totalSeats) * 100).toFixed(2)) : 0;
  const revenue = showtime.reservationSeats.reduce((sum, s) => sum + s.price, 0);

  return {
    showtimeId: showtime.id,
    movie: showtime.movie.title,
    cinema: showtime.hall.cinema.name,
    hall: showtime.hall.name,
    startsAt: showtime.startsAt,
    totalSeats,
    bookedSeats,
    availableSeats: totalSeats - bookedSeats,
    occupancyRate: `${occupancyRate}%`,
    revenue,
  };
}

async function getRevenueReport(query = {}) {
  const { startDate, endDate } = query;
  const where = {
    status: 'CONFIRMED',
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      showtime: {
        include: {
          movie: { select: { id: true, title: true } },
        },
      },
    },
  });

  let totalRevenue = 0;
  const movieRevenueMap = {};

  for (const resv of reservations) {
    totalRevenue += resv.totalAmount;
    const movieId = resv.showtime.movie.id;
    const movieTitle = resv.showtime.movie.title;

    if (!movieRevenueMap[movieId]) {
      movieRevenueMap[movieId] = {
        movieId,
        movieTitle,
        totalBookings: 0,
        revenue: 0,
      };
    }

    movieRevenueMap[movieId].totalBookings += 1;
    movieRevenueMap[movieId].revenue += resv.totalAmount;
  }

  return {
    totalRevenue,
    totalBookings: reservations.length,
    byMovie: Object.values(movieRevenueMap).sort((a, b) => b.revenue - a.revenue),
  };
}

module.exports = {
  getReservationSummary,
  getShowtimeOccupancy,
  getRevenueReport,
};


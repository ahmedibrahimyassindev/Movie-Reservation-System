const { prisma } = require('../config');

async function listShowtimes(query = {}) {
  const { movieId, cinemaId, date } = query;
  const where = {};

  if (movieId) {
    where.movieId = movieId;
  }

  if (cinemaId) {
    where.hall = {
      cinemaId,
    };
  }

  if (date) {
    // Expect date in format YYYY-MM-DD
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    where.startsAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  return prisma.showtime.findMany({
    where,
    include: {
      movie: true,
      hall: {
        include: {
          cinema: true,
        },
      },
    },
    orderBy: { startsAt: 'asc' },
  });
}

async function getShowtimeById(id) {
  const showtime = await prisma.showtime.findUnique({
    where: { id },
    include: {
      movie: true,
      hall: {
        include: {
          cinema: true,
        },
      },
      _count: {
        select: {
          reservationSeats: {
            where: { status: 'CONFIRMED' },
          },
        },
      },
    },
  });

  if (!showtime) {
    const error = new Error('Showtime not found');
    error.statusCode = 404;
    throw error;
  }

  return showtime;
}

async function createShowtime({ movieId, hallId, startsAt, endsAt, ticketPrice }) {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    const error = new Error('Movie not found');
    error.statusCode = 404;
    throw error;
  }

  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) {
    const error = new Error('Hall not found');
    error.statusCode = 404;
    throw error;
  }

  const start = new Date(startsAt);
  let end;

  if (endsAt) {
    end = new Date(endsAt);
  } else {
    // 15-minute cleaning/ad buffer
    const bufferMinutes = 15;
    end = new Date(start.getTime() + (movie.durationMinutes + bufferMinutes) * 60000);
  }

  if (end <= start) {
    const error = new Error('Showtime endsAt must be after startsAt');
    error.statusCode = 400;
    throw error;
  }

  // Check for overlapping showtimes in the same hall
  const overlapping = await prisma.showtime.findFirst({
    where: {
      hallId,
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
    include: {
      movie: { select: { title: true } },
    },
  });

  if (overlapping) {
    const error = new Error(
      `Hall is already scheduled for "${overlapping.movie.title}" between ${overlapping.startsAt.toISOString()} and ${overlapping.endsAt.toISOString()}`
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.showtime.create({
    data: {
      movieId,
      hallId,
      startsAt: start,
      endsAt: end,
      ticketPrice,
    },
    include: {
      movie: true,
      hall: true,
    },
  });
}

async function updateShowtime(id, data) {
  const existing = await getShowtimeById(id);

  const movieId = data.movieId || existing.movieId;
  const hallId = data.hallId || existing.hallId;
  const start = data.startsAt ? new Date(data.startsAt) : existing.startsAt;
  let end = data.endsAt ? new Date(data.endsAt) : existing.endsAt;

  if (data.startsAt && !data.endsAt && data.movieId) {
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (movie) {
      end = new Date(start.getTime() + (movie.durationMinutes + 15) * 60000);
    }
  }

  if (end <= start) {
    const error = new Error('Showtime endsAt must be after startsAt');
    error.statusCode = 400;
    throw error;
  }

  // Check overlap excluding this showtime
  const overlapping = await prisma.showtime.findFirst({
    where: {
      id: { not: id },
      hallId,
      startsAt: { lt: end },
      endsAt: { gt: start },
    },
    include: {
      movie: { select: { title: true } },
    },
  });

  if (overlapping) {
    const error = new Error(
      `Hall schedule conflict with "${overlapping.movie.title}" (${overlapping.startsAt.toISOString()} to ${overlapping.endsAt.toISOString()})`
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.showtime.update({
    where: { id },
    data: {
      movieId: data.movieId,
      hallId: data.hallId,
      startsAt: start,
      endsAt: end,
      ticketPrice: data.ticketPrice,
    },
    include: {
      movie: true,
      hall: true,
    },
  });
}

async function deleteShowtime(id) {
  await getShowtimeById(id);

  return prisma.showtime.delete({
    where: { id },
  });
}

async function getShowtimeSeats(showtimeId) {
  const showtime = await getShowtimeById(showtimeId);

  // Retrieve all seats in the showtime's hall
  const allSeats = await prisma.seat.findMany({
    where: { hallId: showtime.hallId },
    orderBy: [{ row: 'asc' }, { number: 'asc' }],
  });

  // Retrieve actively reserved seat IDs for this showtime
  const bookedReservationSeats = await prisma.reservationSeat.findMany({
    where: {
      showtimeId,
      status: 'CONFIRMED',
    },
    select: { seatId: true },
  });

  const bookedSeatIdSet = new Set(bookedReservationSeats.map((rs) => rs.seatId));

  const seatsWithStatus = allSeats.map((seat) => ({
    id: seat.id,
    row: seat.row,
    number: seat.number,
    seatType: seat.seatType,
    isAvailable: !bookedSeatIdSet.has(seat.id),
  }));

  return {
    showtime: {
      id: showtime.id,
      movie: showtime.movie.title,
      hall: showtime.hall.name,
      cinema: showtime.hall.cinema.name,
      startsAt: showtime.startsAt,
      endsAt: showtime.endsAt,
      ticketPrice: showtime.ticketPrice,
      totalSeats: allSeats.length,
      availableSeats: allSeats.length - bookedSeatIdSet.size,
    },
    seats: seatsWithStatus,
  };
}

module.exports = {
  listShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimeSeats,
};


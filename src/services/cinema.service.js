const { prisma } = require('../config');

async function listCinemas() {
  return prisma.cinema.findMany({
    include: {
      _count: {
        select: { halls: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

async function getCinemaById(id) {
  const cinema = await prisma.cinema.findUnique({
    where: { id },
    include: {
      halls: {
        include: {
          _count: {
            select: { seats: true },
          },
        },
      },
    },
  });

  if (!cinema) {
    const error = new Error('Cinema not found');
    error.statusCode = 404;
    throw error;
  }

  return cinema;
}

async function createCinema(data) {
  return prisma.cinema.create({
    data,
  });
}

async function listHallsByCinemaId(cinemaId) {
  await getCinemaById(cinemaId);

  return prisma.hall.findMany({
    where: { cinemaId },
    include: {
      _count: {
        select: { seats: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

async function createHall(cinemaId, { name, rows = 5, seatsPerRow = 10, seatCapacity }) {
  await getCinemaById(cinemaId);

  const capacity = seatCapacity || (rows * seatsPerRow);

  const hall = await prisma.hall.create({
    data: {
      cinemaId,
      name,
      seatCapacity: capacity,
    },
  });

  // Automatically seed seats for the hall
  const seatData = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let r = 0; r < rows; r++) {
    const rowChar = alphabet[r];
    for (let num = 1; num <= seatsPerRow; num++) {
      seatData.push({
        hallId: hall.id,
        row: rowChar,
        number: num,
        seatType: r === rows - 1 ? 'VIP' : 'STANDARD',
      });
    }
  }

  if (seatData.length > 0) {
    await prisma.seat.createMany({
      data: seatData,
    });
  }

  return prisma.hall.findUnique({
    where: { id: hall.id },
    include: {
      seats: {
        orderBy: [{ row: 'asc' }, { number: 'asc' }],
      },
    },
  });
}

module.exports = {
  listCinemas,
  getCinemaById,
  createCinema,
  listHallsByCinemaId,
  createHall,
};


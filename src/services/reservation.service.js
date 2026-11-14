const { prisma } = require('../config');

async function createReservation({ userId, showtimeId, seatIds }) {
  // Execute atomically in a transaction
  return prisma.$transaction(async (tx) => {
    // 1. Verify showtime existence
    const showtime = await tx.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        hall: true,
      },
    });

    if (!showtime) {
      const error = new Error('Showtime not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify showtime has not already begun
    if (new Date() >= new Date(showtime.startsAt)) {
      const error = new Error('Cannot reserve seats for a showtime that has already started');
      error.statusCode = 400;
      throw error;
    }

    // 3. Verify requested seats belong to the correct hall
    const validSeats = await tx.seat.findMany({
      where: {
        id: { in: seatIds },
        hallId: showtime.hallId,
      },
    });

    if (validSeats.length !== seatIds.length) {
      const error = new Error('One or more selected seats do not belong to this screening hall');
      error.statusCode = 400;
      throw error;
    }

    // 4. Atomically check if any seat is already booked for this showtime
    const alreadyBooked = await tx.reservationSeat.findMany({
      where: {
        showtimeId,
        seatId: { in: seatIds },
        status: 'CONFIRMED',
      },
      include: {
        seat: true,
      },
    });

    if (alreadyBooked.length > 0) {
      const bookedSeatLabels = alreadyBooked
        .map((rs) => `${rs.seat.row}${rs.seat.number}`)
        .join(', ');
      const error = new Error(
        `The following seats are already reserved: ${bookedSeatLabels}`
      );
      error.statusCode = 409; // HTTP 409 Conflict
      throw error;
    }

    // 5. Calculate total amount
    const totalAmount = validSeats.reduce((sum, seat) => {
      // Optional premium for VIP seats
      const multiplier = seat.seatType === 'VIP' ? 1.25 : 1.0;
      return sum + showtime.ticketPrice * multiplier;
    }, 0);

    // 6. Create reservation record
    const reservation = await tx.reservation.create({
      data: {
        userId,
        showtimeId,
        status: 'CONFIRMED',
        totalAmount,
      },
    });

    // 7. Create reservation seat records
    const reservationSeatData = validSeats.map((seat) => ({
      reservationId: reservation.id,
      showtimeId,
      seatId: seat.id,
      price: seat.seatType === 'VIP' ? showtime.ticketPrice * 1.25 : showtime.ticketPrice,
      status: 'CONFIRMED',
    }));

    await tx.reservationSeat.createMany({
      data: reservationSeatData,
    });

    // 8. Return complete reservation with seat and showtime details
    return tx.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        showtime: {
          include: {
            movie: true,
            hall: {
              include: { cinema: true },
            },
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
      },
    });
  });
}

async function getUserReservations(userId) {
  return prisma.reservation.findMany({
    where: { userId },
    include: {
      showtime: {
        include: {
          movie: true,
          hall: {
            include: { cinema: true },
          },
        },
      },
      seats: {
        include: {
          seat: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getReservationById(reservationId, user) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      showtime: {
        include: {
          movie: true,
          hall: {
            include: { cinema: true },
          },
        },
      },
      seats: {
        include: {
          seat: true,
        },
      },
    },
  });

  if (!reservation) {
    const error = new Error('Reservation not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: Owner or Admin
  if (user.role !== 'ADMIN' && reservation.userId !== user.id) {
    const error = new Error('Forbidden: You do not have access to this reservation');
    error.statusCode = 403;
    throw error;
  }

  return reservation;
}

async function cancelReservation(reservationId, user) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: {
        showtime: true,
      },
    });

    if (!reservation) {
      const error = new Error('Reservation not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && reservation.userId !== user.id) {
      const error = new Error('Forbidden: You can only cancel your own reservations');
      error.statusCode = 403;
      throw error;
    }

    if (reservation.status === 'CANCELLED') {
      const error = new Error('Reservation is already cancelled');
      error.statusCode = 400;
      throw error;
    }

    // Cancellation policy: showtime must be in the future
    if (new Date() >= new Date(reservation.showtime.startsAt)) {
      const error = new Error('Cannot cancel reservation for past or ongoing showtimes');
      error.statusCode = 400;
      throw error;
    }

    // Update reservation status
    const updatedReservation = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    // Release seats by marking reservation_seats as CANCELLED
    await tx.reservationSeat.updateMany({
      where: { reservationId },
      data: { status: 'CANCELLED' },
    });

    return updatedReservation;
  });
}

module.exports = {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
};


const { z } = require('zod');

const createReservationSchema = z.object({
  body: z.object({
    showtimeId: z.string().uuid('Invalid showtime ID format'),
    seatIds: z.array(z.string().uuid('Invalid seat ID format')).min(1, 'At least one seat must be selected'),
  }),
});

module.exports = {
  createReservationSchema,
};


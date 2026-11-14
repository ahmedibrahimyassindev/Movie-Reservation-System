const { z } = require('zod');

const createShowtimeSchema = z.object({
  body: z.object({
    movieId: z.string().uuid('Invalid movie ID format'),
    hallId: z.string().uuid('Invalid hall ID format'),
    startsAt: z.string().datetime('startsAt must be a valid ISO datetime string'),
    endsAt: z.string().datetime('endsAt must be a valid ISO datetime string').optional(),
    ticketPrice: z.number().positive('Ticket price must be positive'),
  }),
});

const updateShowtimeSchema = z.object({
  body: z.object({
    movieId: z.string().uuid().optional(),
    hallId: z.string().uuid().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    ticketPrice: z.number().positive().optional(),
  }),
});

module.exports = {
  createShowtimeSchema,
  updateShowtimeSchema,
};


const { z } = require('zod');

const createCinemaSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    location: z.string().min(1, 'Location is required'),
  }),
});

const createHallSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    seatCapacity: z.number().int().positive().optional(),
    rows: z.number().int().min(1).max(26).default(5),
    seatsPerRow: z.number().int().min(1).max(30).default(10),
  }),
});

module.exports = {
  createCinemaSchema,
  createHallSchema,
};


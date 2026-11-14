const { z } = require('zod');

const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    posterUrl: z.string().url('Invalid poster URL').optional(),
    genre: z.string().min(1, 'Genre is required'),
    durationMinutes: z.number().int().positive('Duration must be a positive integer'),
    releaseDate: z.string().datetime().optional(),
  }),
});

const updateMovieSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    posterUrl: z.string().url().optional(),
    genre: z.string().min(1).optional(),
    durationMinutes: z.number().int().positive().optional(),
    releaseDate: z.string().datetime().optional(),
  }),
});

module.exports = {
  createMovieSchema,
  updateMovieSchema,
};


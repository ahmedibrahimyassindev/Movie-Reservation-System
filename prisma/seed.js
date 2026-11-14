const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const userPasswordHash = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@moviereserve.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@moviereserve.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  console.log(`👤 Seeded users: ${admin.email} (ADMIN), ${demoUser.email} (USER)`);

  // 2. Seed Movies
  const movie1 = await prisma.movie.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
      genre: 'Sci-Fi',
      durationMinutes: 148,
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
      releaseDate: new Date('2010-07-16T00:00:00.000Z'),
    },
  });

  const movie2 = await prisma.movie.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      genre: 'Action',
      durationMinutes: 152,
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      releaseDate: new Date('2008-07-18T00:00:00.000Z'),
    },
  });

  console.log(`🎬 Seeded movies: ${movie1.title}, ${movie2.title}`);

  // 3. Seed Cinema & Hall
  let cinema = await prisma.cinema.findFirst({
    where: { name: 'Grand Horizon Cinema' },
  });

  if (!cinema) {
    cinema = await prisma.cinema.create({
      data: {
        name: 'Grand Horizon Cinema',
        location: 'Downtown Center, 5th Avenue',
      },
    });
  }

  let hall = await prisma.hall.findFirst({
    where: { cinemaId: cinema.id, name: 'IMAX Auditorium 1' },
  });

  if (!hall) {
    hall = await prisma.hall.create({
      data: {
        cinemaId: cinema.id,
        name: 'IMAX Auditorium 1',
        seatCapacity: 30,
      },
    });

    // Create 3 rows (A, B, C) of 10 seats
    const rows = ['A', 'B', 'C'];
    const seats = [];

    for (const row of rows) {
      for (let num = 1; num <= 10; num++) {
        seats.push({
          hallId: hall.id,
          row,
          number: num,
          seatType: row === 'C' ? 'VIP' : 'STANDARD',
        });
      }
    }

    await prisma.seat.createMany({ data: seats });
  }

  console.log(`🏛️ Seeded cinema: ${cinema.name} with hall: ${hall.name}`);

  // 4. Seed Showtime
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow.getTime() + (movie1.durationMinutes + 15) * 60000);

  const existingShowtime = await prisma.showtime.findFirst({
    where: {
      movieId: movie1.id,
      hallId: hall.id,
      startsAt: tomorrow,
    },
  });

  if (!existingShowtime) {
    const showtime = await prisma.showtime.create({
      data: {
        movieId: movie1.id,
        hallId: hall.id,
        startsAt: tomorrow,
        endsAt: tomorrowEnd,
        ticketPrice: 15.0,
      },
    });
    console.log(`🕒 Seeded showtime: ${showtime.id} for ${movie1.title}`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


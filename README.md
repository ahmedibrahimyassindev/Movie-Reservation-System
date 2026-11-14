# 🎬 Movie Reservation System

A production-grade RESTful backend API for managing movie listings, cinema showtimes, seat availability, and ticket reservations. The system supports customer accounts and administrator access, allowing users to browse movies, choose showtimes, reserve seats atomically, and manage upcoming bookings.

This project is built following the [roadmap.sh Movie Reservation System challenge](https://roadmap.sh/projects/movie-reservation-system).

---

## ✨ Features

### Authentication & Authorization
- User registration and login with secure password hashing (`bcrypt`).
- JWT-based stateless authentication with token expiration.
- Role-based access control (RBAC) with `USER` and `ADMIN` roles.
- Protected profile (`/api/auth/me`) and admin-guarded operational endpoints.

### Movie Management
- Full CRUD operations for movies (Admin only for write operations).
- Store title, description, poster image URL, genre, duration in minutes, and release date.
- Search and filter movies by genre, title, and release status.

### Cinema, Hall & Showtime Management
- Multi-cinema and multi-hall configuration (Cinema -> Halls -> Seats).
- Create and schedule showtimes with automated `endsAt` calculation (`startsAt + durationMinutes + cleaningBuffer`).
- Real-time schedule overlap detection preventing double-booking halls for simultaneous screenings.
- Query showtimes filtered by movie, cinema, and date.

### Seat & Reservation Management
- Interactive seat grid layout with real-time seat availability calculation for each showtime.
- **Atomic reservation handling** inside database transactions to eliminate race conditions and overbooking.
- **Seat release on cancellation**: Cancelled reservations release seats back to the pool cleanly.
- User booking history and cancellation for eligible upcoming showtimes.

### Admin Reporting
- System-wide reservation overviews with status breakdown (`CONFIRMED`, `CANCELLED`).
- Showtime capacity and occupancy rate calculations.
- Revenue analytics aggregated by movie, showtime, and date range.

---

## 🧰 Tech Stack

- **Runtime:** Node.js (v18+ LTS recommended)
- **Backend Framework:** Express.js
- **Language:** JavaScript (ES Modules / Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password Hashing:** `bcrypt`
- **Validation:** `zod`
- **Testing:** Jest & Supertest
- **Security & Utilities:** `helmet`, `cors`, `dotenv`, `morgan`

---

## 🏗️ Core Data Models

```mermaid
erDiagram
    USER ||--o{ RESERVATION : places
    CINEMA ||--o{ HALL : contains
    HALL ||--o{ SEAT : has
    HALL ||--o{ SHOWTIME : hosts
    MOVIE ||--o{ SHOWTIME : features
    SHOWTIME ||--o{ RESERVATION : booked_in
    SHOWTIME ||--o{ RESERVATION_SEAT : assigns
    RESERVATION ||--o{ RESERVATION_SEAT : includes
    SEAT ||--o{ RESERVATION_SEAT : represents

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string role "USER | ADMIN"
        datetime createdAt
    }
    MOVIE {
        string id PK
        string title
        string description
        string posterUrl
        string genre
        int durationMinutes
        datetime releaseDate
    }
    CINEMA {
        string id PK
        string name
        string location
    }
    HALL {
        string id PK
        string cinemaId FK
        string name
        int seatCapacity
    }
    SEAT {
        string id PK
        string hallId FK
        string row
        int number
        string seatType "STANDARD | VIP | ACCESSIBLE"
    }
    SHOWTIME {
        string id PK
        string movieId FK
        string hallId FK
        datetime startsAt
        datetime endsAt
        float ticketPrice
    }
    RESERVATION {
        string id PK
        string userId FK
        string showtimeId FK
        string status "CONFIRMED | CANCELLED"
        float totalAmount
        datetime createdAt
    }
    RESERVATION_SEAT {
        string id PK
        string reservationId FK
        string showtimeId FK
        string seatId FK
        float price
    }
```

### Relational Schema Summary

| Entity | Primary Attributes & Keys | Description |
| :--- | :--- | :--- |
| **User** | `id`, `name`, `email` (UQ), `passwordHash`, `role`, `createdAt` | Accounts with `USER` or `ADMIN` roles |
| **Movie** | `id`, `title`, `description`, `posterUrl`, `genre`, `durationMinutes`, `releaseDate` | Film catalog details |
| **Cinema** | `id`, `name`, `location` | Physical theater location |
| **Hall** | `id`, `cinemaId` (FK), `name`, `seatCapacity` | Individual screening auditorium |
| **Seat** | `id`, `hallId` (FK), `row`, `number`, `seatType` | Unique seat within a specific hall |
| **Showtime** | `id`, `movieId` (FK), `hallId` (FK), `startsAt`, `endsAt`, `ticketPrice` | Scheduled screening session |
| **Reservation** | `id`, `userId` (FK), `showtimeId` (FK), `status`, `totalAmount`, `createdAt` | Customer ticket order |
| **ReservationSeat**| `id`, `reservationId` (FK), `showtimeId` (FK), `seatId` (FK), `price` | Mapping of reserved seats per showtime |

---

## 🔐 Important Business Rules

### 1. Concurrency & Double Booking Prevention
Seat reservation must be executed atomically. Checking availability and inserting a booking in separate, uncoordinated steps allows race conditions under high concurrency.
- All reservation creation requests run inside a **Prisma database transaction (`prisma.$transaction`)**.
- The database enforces active seat isolation: either by a transactional check verifying no active (`CONFIRMED`) `ReservationSeat` exists for `(showtimeId, seatId)` before committing, or using a partial unique index:
  ```sql
  CREATE UNIQUE INDEX unique_active_seat_booking 
  ON "ReservationSeat" ("showtimeId", "seatId") 
  WHERE "status" = 'CONFIRMED';
  ```
- Any conflict triggers an immediate rollback with an **HTTP `409 Conflict`** response.

### 2. Cancellation & Seat Release Policy
- Users can cancel only their own reservations (`Owner`); Admins can cancel any reservation.
- Cancellations are permitted **only if the showtime has not yet started** (e.g. at least 30 minutes prior to `startsAt`).
- Upon cancellation, the reservation status is updated to `CANCELLED` and its associated `ReservationSeat` records are released, immediately making those seats available again for other users.

### 3. Showtime Scheduling & Overlap Protection
- When creating or updating a showtime, the system automatically checks for overlaps in the same hall:
  $$\text{Existing.startsAt} < \text{New.endsAt} \quad \text{and} \quad \text{Existing.endsAt} > \text{New.startsAt}$$
- By default, `endsAt` is automatically calculated as:
  $$\text{endsAt} = \text{startsAt} + \text{Movie.durationMinutes} + 15\text{ minutes buffer}$$
- Conflicting schedules return an **HTTP `400 Bad Request`** with details about the conflicting screening.

### 4. Role-Based Access Control (RBAC)
- **Public**: Browse movies, cinemas, halls, showtimes, and view available seats.
- **User**: Register, log in, create reservations, view their own bookings, cancel their bookings.
- **Admin**: All User capabilities plus manage movies, cinemas, halls, showtimes, view all reservations, and access reporting endpoints.

---

## 📡 API Overview

> 📚 **Interactive Swagger / OpenAPI Documentation**:
> Once the server is running, navigate to [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) to explore and interact with all endpoints directly from your browser.

### 1. Authentication

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new account | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |

#### Request Example: `POST /api/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

---

### 2. Movies

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies` | List movies (supports `?genre=...&search=...`) | Public |
| `GET` | `/api/movies/:movieId` | Get movie details | Public |
| `POST` | `/api/movies` | Create a new movie | Admin |
| `PATCH` | `/api/movies/:movieId` | Update movie details | Admin |
| `DELETE` | `/api/movies/:movieId` | Remove a movie | Admin |

#### Request Example: `POST /api/movies`
```json
{
  "title": "Interstellar",
  "description": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  "posterUrl": "https://example.com/posters/interstellar.jpg",
  "genre": "Sci-Fi",
  "durationMinutes": 169,
  "releaseDate": "2014-11-07T00:00:00.000Z"
}
```

---

### 3. Cinemas, Halls & Showtimes

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cinemas` | List all cinemas | Public |
| `GET` | `/api/cinemas/:cinemaId` | Get cinema details | Public |
| `POST` | `/api/cinemas` | Create a cinema | Admin |
| `GET` | `/api/cinemas/:cinemaId/halls` | List all halls in a cinema | Public |
| `POST` | `/api/cinemas/:cinemaId/halls` | Create a hall with seat configuration | Admin |
| `GET` | `/api/showtimes` | Query showtimes (`?cinemaId=...&movieId=...&date=YYYY-MM-DD`) | Public |
| `GET` | `/api/movies/:movieId/showtimes`| List upcoming showtimes for a specific movie | Public |
| `GET` | `/api/showtimes/:showtimeId` | Get showtime details with pricing & hall info | Public |
| `POST` | `/api/showtimes` | Create a showtime (with schedule validation) | Admin |
| `PATCH` | `/api/showtimes/:showtimeId` | Update showtime timing or hall | Admin |
| `DELETE` | `/api/showtimes/:showtimeId` | Delete an upcoming showtime | Admin |

#### Request Example: `POST /api/showtimes`
```json
{
  "movieId": "clw1234567890",
  "hallId": "clw0987654321",
  "startsAt": "2026-12-01T19:00:00.000Z",
  "ticketPrice": 12.50
}
```
*(Note: `endsAt` will automatically default to `startsAt + duration + 15 min buffer` if omitted).*

---

### 4. Seats & Reservations

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/showtimes/:showtimeId/seats` | Get seat grid with availability status | Public |
| `POST` | `/api/reservations` | Atomically reserve selected seats | User |
| `GET` | `/api/reservations/me` | List current user's reservations | User |
| `GET` | `/api/reservations/:reservationId` | Get reservation details | Owner / Admin |
| `PATCH`| `/api/reservations/:reservationId/cancel` | Cancel booking & release seats | Owner / Admin |

#### Request Example: `POST /api/reservations`
```json
{
  "showtimeId": "clwshowtime123",
  "seatIds": [
    "clwseat01",
    "clwseat02"
  ]
}
```

#### Response Example: `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "clwresv999",
    "showtimeId": "clwshowtime123",
    "status": "CONFIRMED",
    "totalAmount": 25.00,
    "seats": [
      { "seatId": "clwseat01", "row": "A", "number": 1, "price": 12.50 },
      { "seatId": "clwseat02", "row": "A", "number": 2, "price": 12.50 }
    ],
    "createdAt": "2026-11-14T20:30:00.000Z"
  }
}
```

---

### 5. Admin Reports

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/reports/reservations` | System-wide reservation metrics & history | Admin |
| `GET` | `/api/admin/reports/showtimes/:showtimeId` | Occupancy percentage and seat breakdown | Admin |
| `GET` | `/api/admin/reports/revenue` | Revenue aggregate (`?startDate=...&endDate=...`) | Admin |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or v20.x+ LTS)
- npm or pnpm
- PostgreSQL instance (local or managed, e.g. Neon, Supabase, Railway)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/movie-reservation-system.git
cd movie-reservation-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Set your configuration variables:
```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:password@localhost:5432/movie_reservation_db?schema=public"

JWT_SECRET="super_secret_jwt_key_replace_in_production"
JWT_EXPIRES_IN="1d"

CORS_ORIGIN="http://localhost:5173"
```

### 4. Database migrations & seeding
```bash
# Push schema migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed sample data (admin user, sample movies, halls, seats, showtimes)
npm run seed
```

### 5. Run the application
```bash
# Development mode with hot-reload
npm run dev

# Production start
npm start
```

---

## 🧪 Testing

Run automated unit and integration tests:
```bash
npm test
```

### Test Coverage Focus
- **Authentication**: JWT issuance, invalid tokens, password verification, hashing.
- **Authorization**: Role guards ensuring non-admins cannot access admin endpoints.
- **Schedule Conflict**: Preventing overlapping showtimes in the same hall.
- **Concurrency & Double Booking**: Parallel attempts to reserve the same seat responding with `409 Conflict`.
- **Seat Lifecycle**: Releasing seats upon reservation cancellation.

---

## 🌍 Production & Serverless Considerations

When deploying to serverless platforms such as Vercel or AWS Lambda:
1. **Connection Pooling**: Use connection poolers like PgBouncer or connection strings from Neon / Supabase with transaction poolers (`?pgbouncer=true`).
2. **Prisma Client Instantiation**: Cache the `PrismaClient` instance on global scope to avoid connection exhaustion across lambda invocations.
3. **Stateless Locks**: Do not rely on local in-memory locks for seat availability; use the database transaction isolation levels.

---

## 📁 Project Directory Structure

```text
movie-reservation-system/
├── prisma/
│   ├── schema.prisma          # Database schema models
│   └── seed.js                # Database seeder (Admin, sample cinema, movies)
├── src/
│   ├── config/                # Environment and DB client setup
│   ├── controllers/           # Request handlers (auth, movies, showtimes, reservations, reports)
│   ├── middlewares/           # Auth, RBAC, error handling, validation middleware
│   ├── routes/                # Express route definitions
│   ├── services/              # Core business logic & database transactions
│   ├── validators/            # Zod request validation schemas
│   ├── utils/                 # Helpers (JWT sign/verify, response formatters)
│   ├── app.js                 # Express app definition & middleware wiring
│   └── server.js              # Server entry point
├── tests/                     # Jest / Supertest integration test suites
├── .env.example               # Template environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License - see the `LICENSE` file for details.

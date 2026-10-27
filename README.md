# iMovies — MERN movie ticket booking app

A beginner-friendly MERN stack capstone starter with movie browsing, registration/login, showtime selection, seat availability, ticket booking, and booking history.

## Tech stack
- React + Vite + Bootstrap
- Node.js + Express REST API
- MongoDB + Mongoose
- JWT authentication and bcrypt password hashing

## Requirements
- Node.js 18+ (LTS recommended)
- MongoDB local service OR a MongoDB Atlas connection string
- VS Code recommended

## Run on Windows
1. Install Node.js LTS from https://nodejs.org/en/download/
2. Install MongoDB Community Server from https://www.mongodb.com/try/download/community, OR create a free MongoDB Atlas database at https://www.mongodb.com/cloud/atlas.
3. Extract this ZIP and open the `imovies-mern` folder in VS Code.
4. Open a terminal in that folder and run:
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```
5. Copy `server/.env.example` to `server/.env`.
6. If using local MongoDB, keep the example MONGODB_URI. If using Atlas, replace it with your Atlas connection string. Change JWT_SECRET to a long random value.
7. Make sure the MongoDB service is running.
8. Start the API:
   ```bash
   npm run server
   ```
9. Open a second terminal in the same folder and start the frontend:
   ```bash
   npm run client
   ```
10. Visit http://localhost:5173

## Features
- Responsive movie listing and search
- Register and login with JWT
- Showtimes and interactive seat selection
- Reads already-booked seats from MongoDB
- Booking confirmation and booking history
- API health endpoint at `/api/health`

## Important notes
- This is an educational capstone starter. It does not take real payments.
- Seat availability is rechecked by the API when a booking is submitted, but a high-traffic commercial system should use a database transaction or a dedicated unique-seat reservation model to guarantee concurrency safety.
- Demo movies are inserted automatically the first time the movie list is requested.
- Never commit your `.env` file, passwords, database credentials, or JWT secret to GitHub.

## API overview
- `GET /api/health`
- `GET /api/movies`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/movies/:id/seats?showtime=...`
- `POST /api/bookings` (JWT required)
- `GET /api/bookings/mine` (JWT required)

## Deployment
Deploy the API and frontend separately (for example, API on Render and frontend on Vercel). Configure the API's `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`, then set `VITE_API_URL` for the frontend to the deployed API base URL ending in `/api`. Free hosting and database availability can change; verify current provider limits before deployment.

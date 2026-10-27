import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Movie, Booking } from "./models.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-change-me";

const seedMovies = [
  { title: "The Last Horizon", genre: "Sci-Fi / Adventure", duration: "2h 08m", rating: "8.4", description: "A breathtaking journey beyond the edge of the known universe.", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=900&q=80", showtimes: ["10:30 AM", "1:45 PM", "5:15 PM", "8:30 PM"] },
  { title: "Midnight in Mumbai", genre: "Drama / Romance", duration: "1h 56m", rating: "7.9", description: "Two strangers find their stories intertwined in a city that never sleeps.", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80", showtimes: ["11:00 AM", "2:20 PM", "6:00 PM", "9:10 PM"] },
  { title: "Kingdom of Ash", genre: "Action / Fantasy", duration: "2h 21m", rating: "8.1", description: "An unlikely hero rises when an ancient kingdom faces its final battle.", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80", showtimes: ["10:00 AM", "1:30 PM", "4:45 PM", "8:00 PM"] },
  { title: "The Great Heist", genre: "Thriller / Crime", duration: "2h 02m", rating: "8.7", description: "One impossible plan. Five specialists. No room for mistakes.", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80", showtimes: ["12:00 PM", "3:15 PM", "6:40 PM", "9:30 PM"] }
];

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "iMovies API" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6)
      return res.status(400).json({ message: "Enter your name, a valid email, and a password of at least 6 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 10) });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ message: "Could not create account.", detail: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || "").trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash)))
      return res.status(401).json({ message: "Email or password is incorrect." });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ message: "Could not log in.", detail: e.message }); }
});

app.get("/api/movies", async (_req, res) => {
  try {
    let movies = await Movie.find().sort({ createdAt: 1 });
    if (!movies.length) movies = await Movie.insertMany(seedMovies);
    res.json(movies);
  } catch (e) { res.status(500).json({ message: "Could not load movies. Check your database connection.", detail: e.message }); }
});

app.get("/api/movies/:id/seats", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    const showtime = String(req.query.showtime || "");
    const bookings = await Booking.find({ movie: movie._id, showtime });
    res.json({ bookedSeats: bookings.flatMap(b => b.seats), seatPrice: 180 });
  } catch (e) { res.status(400).json({ message: "Could not load seat availability.", detail: e.message }); }
});

app.post("/api/bookings", auth, async (req, res) => {
  try {
    const { movieId, showtime, seats } = req.body;
    if (!movieId || !showtime || !Array.isArray(seats) || !seats.length)
      return res.status(400).json({ message: "Choose a showtime and at least one seat." });
    if (seats.length > 8) return res.status(400).json({ message: "You can book up to 8 seats at a time." });
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    const existing = await Booking.find({ movie: movieId, showtime, seats: { $in: seats } });
    if (existing.length) return res.status(409).json({ message: "One or more seats were just booked. Refresh seat availability and choose again." });
    const booking = await Booking.create({
      user: req.user.id, movie: movie._id, showtime, seats,
      total: seats.length * 180,
      bookingCode: "IM-" + crypto.randomBytes(3).toString("hex").toUpperCase()
    });
    res.status(201).json(await Booking.findById(booking._id).populate("movie", "title poster"));
  } catch (e) { res.status(500).json({ message: "Booking failed.", detail: e.message }); }
});

app.get("/api/bookings/mine", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate("movie", "title poster genre").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: "Could not load bookings." }); }
});

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/imovies")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`iMovies API running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Start MongoDB or set MONGODB_URI in server/.env");
    process.exit(1);
  });
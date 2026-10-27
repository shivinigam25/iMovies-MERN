import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: String,
  duration: String,
  rating: String,
  description: String,
  poster: String,
  showtimes: [{ type: String }]
}, { timestamps: true });

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  showtime: { type: String, required: true },
  seats: [{ type: String, required: true }],
  total: { type: Number, required: true },
  bookingCode: { type: String, required: true, unique: true }
}, { timestamps: true });

bookingSchema.index({ movie: 1, showtime: 1 });

export const User = mongoose.model("User", userSchema);
export const Movie = mongoose.model("Movie", movieSchema);
export const Booking = mongoose.model("Booking", bookingSchema);
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const initials = name => (name || "Guest").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("imovies-user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("imovies-token") || "");
  const [modal, setModal] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [showtime, setShowtime] = useState("");
  const [booked, setBooked] = useState([]);
  const [chosen, setChosen] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");

  async function request(path, options = {}) {
    const res = await fetch(API + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  }

  async function loadMovies() {
    setLoading(true);
    try { setMovies(await request("/movies")); }
    catch (e) { setNotice(e.message + " Make sure the backend and MongoDB are running."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadMovies(); }, []);

  async function openBooking(movie) {
    setSelected(movie); setShowtime(movie.showtimes?.[0] || "6:00 PM"); setChosen([]); setModal("booking");
    await loadSeats(movie, movie.showtimes?.[0] || "6:00 PM");
  }
  async function loadSeats(movie, time) {
    try {
      const data = await request(`/movies/${movie._id}/seats?showtime=${encodeURIComponent(time)}`);
      setBooked(data.bookedSeats || []);
    } catch (e) { setNotice(e.message); }
  }
  async function changeShowtime(time) {
    setShowtime(time); setChosen([]);
    if (selected) await loadSeats(selected, time);
  }
  const filtered = useMemo(() => movies.filter(m => `${m.title} ${m.genre}`.toLowerCase().includes(search.toLowerCase())), [movies, search]);

  async function submitAuth(e) {
    e.preventDefault();
    try {
      const data = await request(`/auth/${authMode}`, { method: "POST", body: JSON.stringify(form) });
      setToken(data.token); setUser(data.user);
      localStorage.setItem("imovies-token", data.token);
      localStorage.setItem("imovies-user", JSON.stringify(data.user));
      setModal(""); setNotice(`Welcome${data.user.name ? ", " + data.user.name : ""}! You're signed in.`);
    } catch (e) { setNotice(e.message); }
  }
  function logout() {
    setToken(""); setUser(null); localStorage.removeItem("imovies-token"); localStorage.removeItem("imovies-user");
    setBookings([]); setNotice("You have been logged out.");
  }
  async function loadBookings() {
    if (!token) { setAuthMode("login"); setModal("auth"); return; }
    try { setBookings(await request("/bookings/mine")); setModal("history"); }
    catch (e) { setNotice(e.message); }
  }
  async function confirmBooking() {
    if (!token) { setAuthMode("login"); setModal("auth"); setNotice("Please log in before booking seats."); return; }
    try {
      const booking = await request("/bookings", { method: "POST", body: JSON.stringify({ movieId: selected._id, showtime, seats: chosen }) });
      setNotice(`Booking confirmed! Your code is ${booking.bookingCode}`);
      setModal("success"); setBooked([...booked, ...chosen]); setChosen([]);
    } catch (e) {
      setNotice(e.message);
      if (selected) loadSeats(selected, showtime);
    }
  }

  const seats = Array.from({ length: 6 }, (_, row) => Array.from({ length: 8 }, (_, col) => `${String.fromCharCode(65 + row)}${col + 1}`));
  const price = chosen.length * 180;

  return <div className="app-shell">
    <nav className="navbar topbar">
      <div className="container-fluid nav-inner">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); setModal(""); }}><span className="brand-mark">i</span> MOVIES<span className="brand-dot">.</span></a>
        <div className="nav-actions">
          <button className="nav-link-btn" onClick={loadBookings}>My bookings</button>
          {user ? <><span className="user-chip"><span className="avatar">{initials(user.name)}</span><span className="user-name">{user.name}</span></span><button className="outline-btn" onClick={logout}>Log out</button></>
            : <button className="primary-btn small" onClick={() => { setAuthMode("login"); setModal("auth"); }}>Sign in</button>}
        </div>
      </div>
    </nav>

    <main>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span className="live-dot"></span> THE BIG SCREEN EXPERIENCE</div>
          <h1>Stories worth<br/><em>stepping into.</em></h1>
          <p>Find your next favourite film. Pick your seats.<br className="desktop-break"/> Make a night of it.</p>
          <a className="primary-btn hero-btn" href="#movies">Explore movies <span>↘</span></a>
          <div className="hero-meta"><span>✦ CURATED FOR YOU</span><span>·</span><span>BOOK IN SECONDS</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="poster-back poster-one"></div><div className="poster-back poster-two"></div>
          <div className="poster-front"><img src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=85" alt="Cinema atmosphere"/><div className="poster-overlay"><span>NOW SHOWING</span><strong>THE MAGIC<br/>OF CINEMA</strong></div></div>
          <div className="floating-note"><span>✦</span><div><strong>Your next movie night</strong><small>Starts right here</small></div></div>
        </div>
        <div className="hero-bottom-line"><span>01 / DISCOVER</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="movies-section container-fluid" id="movies">
        <div className="section-heading"><div><div className="eyebrow muted">YOUR FRONT ROW AWAITS</div><h2>Now <em>showing</em></h2><p className="section-sub">Handpicked stories for your next cinema escape.</p></div>
          <div className="search-wrap"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a movie..." aria-label="Search movies"/></div>
        </div>
        {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
        {loading ? <div className="loading">Setting the scene…</div> : !filtered.length ? <div className="loading">No movies found. Try another search.</div> :
          <div className="movie-grid">{filtered.map((movie, i) => <article className="movie-card" key={movie._id}>
            <div className="movie-poster"><img src={movie.poster} alt={movie.title} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80"; }}/><span className="movie-index">0{i + 1}</span><span className="rating">★ {movie.rating || "8.0"}</span><button className="poster-play" aria-label={`Book ${movie.title}`} onClick={() => openBooking(movie)}>↗</button></div>
            <div className="movie-info"><div className="movie-genre">{movie.genre}</div><h3>{movie.title}</h3><div className="movie-foot"><span>{movie.duration}</span><button onClick={() => openBooking(movie)}>Book tickets <span>→</span></button></div></div>
          </article>)}</div>}
      </section>
      <section className="bottom-banner"><div><span className="eyebrow">YOUR NIGHT. YOUR STORY.</span><h2>Make room for <em>movie magic.</em></h2></div><a className="primary-btn" href="#movies">Find your film ↗</a></section>
    </main>
    <footer><a className="brand" href="#"><span className="brand-mark">i</span> MOVIES<span className="brand-dot">.</span></a><span>Made for the love of cinema.</span><span>© 2026 iMovies</span></footer>

    {modal === "auth" && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(""); }}><div className="dialog auth-dialog"><button className="close-btn" onClick={() => setModal("")}>×</button><div className="eyebrow muted">WELCOME TO THE MOVIES</div><h2>{authMode === "login" ? "Good to see you." : "Join the show."}</h2><p className="dialog-sub">{authMode === "login" ? "Sign in to reserve your favourite seats." : "Create an account to make booking easy."}</p>
      <form onSubmit={submitAuth} className="auth-form">{authMode === "register" && <label>Your name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name"/></label>}<label>Email address<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/></label><label>Password<input required minLength="6" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters"/></label><button className="primary-btn full" type="submit">{authMode === "login" ? "Sign in →" : "Create account →"}</button></form>
      <p className="switch-auth">{authMode === "login" ? "New around here?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create account" : "Sign in"}</button></p></div></div>}

    {modal === "booking" && selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(""); }}><div className="dialog booking-dialog"><button className="close-btn" onClick={() => setModal("")}>×</button><div className="eyebrow muted">RESERVE YOUR SEATS</div><h2>{selected.title}</h2><p className="dialog-sub">{selected.genre} · {selected.duration}</p><label className="field-label">Choose a showtime</label><div className="time-options">{(selected.showtimes || []).map(t => <button key={t} className={showtime === t ? "time-option active" : "time-option"} onClick={() => changeShowtime(t)}>{t}</button>)}</div><div className="screen-label"><span></span> SCREEN THIS WAY <span></span></div><div className="seat-grid">{seats.map((row, ri) => <div className="seat-row" key={ri}><small>{String.fromCharCode(65 + ri)}</small>{row.map(s => <button key={s} title={booked.includes(s) ? `${s} is booked` : s} disabled={booked.includes(s)} className={`seat ${booked.includes(s) ? "taken" : chosen.includes(s) ? "chosen" : ""}`} onClick={() => setChosen(chosen.includes(s) ? chosen.filter(x => x !== s) : [...chosen, s])}>{s.slice(1)}</button>)}<small>{String.fromCharCode(65 + ri)}</small></div>)}</div><div className="seat-legend"><span><i className="legend-box"></i>Available</span><span><i className="legend-box selected"></i>Selected</span><span><i className="legend-box unavailable"></i>Booked</span></div><div className="booking-summary"><div><small>{chosen.length} seat(s) selected</small><strong>{money(price)}</strong></div><button className="primary-btn" disabled={!chosen.length} onClick={confirmBooking}>Confirm booking →</button></div><p className="tiny-note">Tickets are ₹180 per seat. Log in is required to confirm a reservation.</p></div></div>}

    {modal === "history" && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(""); }}><div className="dialog history-dialog"><button className="close-btn" onClick={() => setModal("")}>×</button><div className="eyebrow muted">YOUR CINEMA JOURNEY</div><h2>My bookings</h2>{!bookings.length ? <p className="dialog-sub">No bookings yet. Your next movie night is waiting.</p> : bookings.map(b => <div className="history-item" key={b._id}><img src={b.movie?.poster} alt=""/><div><strong>{b.movie?.title}</strong><p>{b.showtime} · Seats {b.seats.join(", ")}</p><small>Booking code: {b.bookingCode}</small></div><b>{money(b.total)}</b></div>)}</div></div>}

    {modal === "success" && <div className="modal-backdrop"><div className="dialog success-dialog"><div className="success-icon">✓</div><div className="eyebrow muted">IT'S A DATE</div><h2>You're all booked.</h2><p className="dialog-sub">{notice}</p><button className="primary-btn full" onClick={() => setModal("")}>Back to movies →</button><button className="text-btn" onClick={loadBookings}>View my bookings</button></div></div>}
  </div>;
}
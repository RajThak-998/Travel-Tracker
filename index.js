import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let db;

// Use DATABASE_URL (from Railway) if available, otherwise local development vars
if (process.env.DATABASE_URL) {
  db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },  // For Railway's managed PostgreSQL
  });
} else {
  db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

// Connect to database
db.connect().then(() => console.log("Connected to PostgreSQL")).catch(err => console.error("DB connection error:", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Global variables
let users = [];
let currentUserId = null;

// Load users from database
async function loadUsers() {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY id");
    users = result.rows;
    console.log("Loaded users:", users);

    if (users.length > 0 && !currentUserId) {
      currentUserId = users[0].id;
      console.log("Set currentUserId to:", currentUserId);
    }
  } catch (err) {
    console.error("Error loading users:", err);
    // Fallback dummy users for testing
    users = [
      { id: 1, name: "Angela", color: "teal" },
      { id: 2, name: "Jack", color: "powderblue" },
    ];
    currentUserId = 1;
  }
}

// Get visited countries
async function checkVisitedCountries(userId) {
  try {
    const result = await db.query(
      "SELECT country_code FROM visited_countries WHERE user_id = $1",
      [userId]
    );
    return result.rows.map(row => row.country_code);
  } catch (err) {
    console.error("Error fetching countries:", err);
    return [];
  }
}

// Get current user
function getCurrentUser() {
  return users.find(user => user.id === currentUserId);
}

// Initialize app (load users)
await loadUsers();

// Routes
app.get("/", async (req, res) => {
  try {
    const countries = await checkVisitedCountries(currentUserId);
    const currentUser = getCurrentUser();

    res.render("index.ejs", {
      countries,
      total: countries.length,
      users,
      color: currentUser ? currentUser.color : "teal",
    });
  } catch (err) {
    console.error("Home route error:", err);
    res.status(500).send("Server Error");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = getCurrentUser();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) throw new Error("Country not found");

    const countryCode = result.rows[0].country_code;

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.error("Duplicate country error:", err);
      const countries = await checkVisitedCountries(currentUserId);
      res.render("index.ejs", {
        countries,
        total: countries.length,
        users,
        color: currentUser ? currentUser.color : "teal",
        error: "Country already added, try again.",
      });
    }
  } catch (err) {
    console.error("Country lookup error:", err);
    const countries = await checkVisitedCountries(currentUserId);
    res.render("index.ejs", {
      countries,
      total: countries.length,
      users,
      color: currentUser ? currentUser.color : "teal",
      error: "Country name does not exist, try again.",
    });
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    const selectedUserId = parseInt(req.body.user);
    const userExists = users.find(user => user.id === selectedUserId);

    if (userExists) {
      currentUserId = selectedUserId;
      console.log("Switched to user:", currentUserId);
    } else {
      console.error("User not found:", selectedUserId);
    }
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const { name, color } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *;",
      [name, color]
    );

    const newUser = result.rows[0];
    currentUserId = newUser.id;
    await loadUsers();

    res.redirect("/");
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send("Error creating user");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

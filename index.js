import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Connect to database
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Global variables
let users = [];
let currentUserId = null;

// Function to load all users from database
async function loadUsers() {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY id");
    users = result.rows;
    console.log("Loaded users:", users);
    
    // Set currentUserId to first user if not set
    if (users.length > 0 && !currentUserId) {
      currentUserId = users[0].id;
      console.log("Set currentUserId to:", currentUserId);
    }
  } catch (err) {
    console.log("Error loading users:", err);
    // Fallback to default users if database query fails
    users = [
      { id: 1, name: "Angela", color: "teal" },
      { id: 2, name: "Jack", color: "powderblue" },
    ];
    currentUserId = 1;
  }
}

// Function to get visited countries for current user
async function checkVisitedCountries(userId) {
  try {
    const result = await db.query(
      "SELECT country_code FROM visited_countries WHERE user_id = $1",
      [userId]
    );

    let countries = [];
    result.rows.forEach((country) => {
      countries.push(country.country_code);
    });
    console.log(`Countries for user ${userId}:`, countries);
    return countries;
  } catch (err) {
    console.log("Error checking visited countries:", err);
    return [];
  }
}

// Function to get current user object
function getCurrentUser() {
  const user = users.find((user) => user.id === currentUserId);
  console.log("Current user:", user);
  return user;
}

// Initialize application
await loadUsers();

// Routes
app.get("/", async (req, res) => {
  try {
    const countries = await checkVisitedCountries(currentUserId);
    const currentUser = getCurrentUser();

    console.log("Rendering page with:", {
      countriesCount: countries.length,
      currentUserId,
      currentUserColor: currentUser?.color,
      totalUsers: users.length
    });

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser ? currentUser.color : "teal",
    });
  } catch (err) {
    console.log("Error in home route:", err);
    res.status(500).send("Server error");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = getCurrentUser();

  try {
    // Find country by name
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error("Country not found");
    }

    const data = result.rows[0];
    const countryCode = data.country_code;

    try {
      // Add country to visited countries
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      console.log(`Added ${countryCode} for user ${currentUserId}`);
      res.redirect("/");
    } catch (err) {
      console.log("Country already added:", err);
      const countries = await checkVisitedCountries(currentUserId);
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser ? currentUser.color : "teal",
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log("Country lookup error:", err);
    const countries = await checkVisitedCountries(currentUserId);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
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
    console.log("Switching to user:", selectedUserId);
    
    // Validate that the user exists in our users array
    const userExists = users.find(user => user.id === selectedUserId);
    if (userExists) {
      currentUserId = selectedUserId;
      console.log("Successfully switched to user:", currentUserId);
    } else {
      console.log("User not found:", selectedUserId);
    }
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  try {
    console.log("Creating new user:", { name, color });
    
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
      [name, color]
    );

    const newUser = result.rows[0];
    console.log("New user created:", newUser);

    // Set current user to the newly created user
    currentUserId = newUser.id;

    // Reload users from database to include the new user
    await loadUsers();
    
    console.log("User creation complete, currentUserId:", currentUserId);
    res.redirect("/");
  } catch (err) {
    console.log("Error creating user:", err);
    res.status(500).send("Error creating user");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

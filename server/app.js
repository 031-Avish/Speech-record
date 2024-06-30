const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Create a connection to the SQLite database
const db = new sqlite3.Database("../database/database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              firstName TEXT,
              lastName TEXT,
              age INTEGER,
              gender TEXT,
              email TEXT
            )`);

    db.run(`CREATE TABLE IF NOT EXISTS village_csv (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT
            )`);
    db.run(`CREATE TABLE IF NOT EXISTS EnglishSentences (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sentence TEXT
            )`);
  }
});

// Route to submit user data
app.post("/submit", (req, res) => {
  const { firstName, lastName, age, gender, email } = req.body;

  // Insert submitted data into the database
  const sql = `INSERT INTO users (firstName, lastName, age, gender, email) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [firstName, lastName, age, gender, email], function (err) {
    if (err) {
      return console.error(
        "Error inserting data into users table:",
        err.message
      );
    }
    console.log(
      `A row has been inserted into users table with rowid ${this.lastID}`
    );
    res.send("User data inserted successfully.");
  });
});

// Route to insert data from CSV file into the village_csv table
app.get("/insert-csv-data", (req, res) => {
  const csvFilePath = "./village.csv";

  // Check if the CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    return res.status(404).send("CSV file not found.");
  }

  // Read CSV file and insert data into village_csv table
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data) => {
      // Insert data into SQLite database
      db.run(
        "INSERT INTO village_csv (name) VALUES (?)",
        [data._0], // Adjust this to match the header of your CSV file
        function (err) {
          if (err) {
            console.error(
              "Error inserting data into village_csv table:",
              err.message
            );
          }
        }
      );
    })
    .on("end", () => {
      console.log("CSV file data inserted into village_csv table.");
      res.send("CSV file data inserted into village_csv table.");
    });
});

app.get("/insert-sentence-csv-data", (req, res) => {
  const EnglishSentenceCSV = "./sentence_db.csv";

  // Check if the CSV file exists
  if (!fs.existsSync(EnglishSentenceCSV)) {
    return res.status(404).send("CSV file not found.");
  }

  // Read CSV file and insert data into EnglishSentenceCSV table
  fs.createReadStream(EnglishSentenceCSV)
    .pipe(csvParser())
    .on("data", (data) => {
      // Insert data into SQLite database
      console.log(data);

      db.run(
        "INSERT INTO  EnglishSentences (sentence) VALUES (?)",
        [data.sentence], // Adjust this to match the header of your CSV file
        function (err) {
          if (err) {
            console.error(
              "Error inserting data into EnglishSentences table:",
              err.message
            );
          }
        }
      );
    })
    .on("end", () => {
      console.log("CSV file data inserted into EnglishSentences table.");
      res.send("CSV file data inserted into EnglishSentences table.");
    });
});
const getRandomIntegers = () => {
  const integers = [];
  for (let i = 0; i < 10; i++) {
    integers.push(Math.floor(Math.random() * 186) + 1);
  }
  return integers;
};

// Route to fetch data from the database based on random integers
app.get("/fetch-data/:data_key", (req, res) => {
  // Generate 5 random integers
  const randomIntegers = getRandomIntegers();
  const key = req.params.data_key;
  const database =
    key === "words"
      ? "village_csv"
      : key === "sentence"
      ? "EnglishSentences"
      : res.json({});
  // Construct SQL query to fetch data based on random integers
  const sql = `SELECT * FROM ${database} WHERE id IN (${randomIntegers.join(
    ","
  )})`;

  // Execute SQL query
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res.status(500).send("Internal server error");
    }
    // Send the fetched data as response
    res.json(rows);
  });
});
app.get("/fetch-data", (req, res) => {
  // Generate 5 random integers
  const randomIntegers = getRandomIntegers();

  // Construct SQL query to fetch data based on random integers
  const sql = `SELECT * FROM EnglishSentences WHERE  id IN (${randomIntegers.join(
    ","
  )})`;

  // Execute SQL query
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res.status(500).send("Internal server error");
    }
    // Send the fetched data as response
    res.json(rows);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

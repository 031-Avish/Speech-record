const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
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

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create a connection to the SQLite database
const db = new sqlite3.Database("../database/database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
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
    db.run(`CREATE TABLE IF NOT EXISTS audio_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      path TEXT
    )`);
  }
});

// Route to submit user data
app.post("/submit", (req, res) => {
  const { firstName, lastName, age, gender, email } = req.body;
  const sql = `INSERT INTO users (firstName, lastName, age, gender, email) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [firstName, lastName, age, gender, email], function (err) {
    if (err) {
      return console.error("Error inserting data into users table:", err.message);
    }
    console.log(`A row has been inserted into users table with rowid ${this.lastID}`);
    res.send("User data inserted successfully.");
  });
});

// Route to insert data from CSV file into the village_csv table
app.get("/insert-csv-data", (req, res) => {
  const csvFilePath = "./village.csv";
  if (!fs.existsSync(csvFilePath)) {
    return res.status(404).send("CSV file not found.");
  }
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on("data", (data) => {
      db.run("INSERT INTO village_csv (name) VALUES (?)", [data._0], function (err) {
        if (err) {
          console.error("Error inserting data into village_csv table:", err.message);
        }
      });
    })
    .on("end", () => {
      console.log("CSV file data inserted into village_csv table.");
      res.send("CSV file data inserted into village_csv table.");
    });
});

app.get("/insert-sentence-csv-data", (req, res) => {
  const EnglishSentenceCSV = "./sentence_db.csv";
  if (!fs.existsSync(EnglishSentenceCSV)) {
    return res.status(404).send("CSV file not found.");
  }
  fs.createReadStream(EnglishSentenceCSV)
    .pipe(csvParser())
    .on("data", (data) => {
      db.run("INSERT INTO EnglishSentences (sentence) VALUES (?)", [data.sentence], function (err) {
        if (err) {
          console.error("Error inserting data into EnglishSentences table:", err.message);
        }
      });
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
  const randomIntegers = getRandomIntegers();
  const key = req.params.data_key;
  const database =
    key === "words" ? "village_csv" : key === "sentence" ? "EnglishSentences" : res.json({});
  const sql = `SELECT * FROM ${database} WHERE id IN (${randomIntegers.join(",")})`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error executing query:", err.message);
      return res.status(500).send("Internal server error");
    }
    res.json(rows);
  });
});

// Route to handle audio file upload
app.post("/upload", upload.single('audio_data'), (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  const sql = `INSERT INTO audio_files (filename, path) VALUES (?, ?)`;
  db.run(sql, [file.filename, file.path], function (err) {
    if (err) {
      return console.error("Error inserting data into audio_files table:", err.message);
    }
    console.log(`A row has been inserted into audio_files table with rowid ${this.lastID}`);
    res.send("Audio file uploaded successfully.");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

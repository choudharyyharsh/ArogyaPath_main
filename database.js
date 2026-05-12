const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'arogyapath.db'));

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS profiles");
    db.run("DROP TABLE IF EXISTS vitals");
    db.run("DROP TABLE IF EXISTS maternal");
    db.run("DROP TABLE IF EXISTS child");

    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT)");
    db.run("CREATE TABLE profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, age INTEGER, gender TEXT, height REAL)");
    db.run("CREATE TABLE vitals (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, blood_sugar INTEGER, systolic INTEGER, diastolic INTEGER, heart_rate INTEGER, weight REAL)");
    db.run("CREATE TABLE maternal (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, week INTEGER, due_date TEXT, weight_gain REAL, fetal_hr INTEGER, iron REAL)");
    db.run("CREATE TABLE child (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, age_months INTEGER, height REAL, weight REAL)");
});

console.log("Database Re-Initialized Successfully.");
module.exports = db;

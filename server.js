const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- DATABASE ---
const dbPath = path.join(__dirname, 'arogyapath.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, age INTEGER, gender TEXT, height REAL)");
    db.run("CREATE TABLE IF NOT EXISTS vitals (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT, blood_sugar INTEGER, systolic INTEGER, diastolic INTEGER, heart_rate INTEGER, weight REAL)");
    db.run("CREATE TABLE IF NOT EXISTS maternal (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, week INTEGER, due_date TEXT, weight_gain REAL, fetal_hr INTEGER, iron REAL)");
    db.run("CREATE TABLE IF NOT EXISTS child (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, age_months INTEGER, height REAL, weight REAL)");
});

// --- FRONTEND ---
// Serving from the local 'public' folder
const frontendDir = path.join(__dirname, 'public');
app.use(express.static(frontendDir));

// --- API ENDPOINTS ---

app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, password], function(err) {
        if (err) return res.status(400).json({ success: false, error: "Email exists" });
        res.json({ success: true, user: { id: this.lastID, name, email } });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (!row) return res.status(401).json({ success: false, error: "Invalid credentials" });
        db.get("SELECT * FROM profiles WHERE user_id = ?", [row.id], (err, profile) => {
            res.json({ success: true, user: row, needsOnboarding: !profile });
        });
    });
});

app.post('/api/onboarding', (req, res) => {
    const { userId, age, gender, height, sugar, heart, systolic, diastolic, weight } = req.body;
    db.run("INSERT INTO profiles (user_id, age, gender, height) VALUES (?, ?, ?, ?)", [userId, age, gender, height], () => {
        db.run("INSERT INTO vitals (user_id, date, blood_sugar, systolic, diastolic, heart_rate, weight) VALUES (?, ?, ?, ?, ?, ?, ?)", 
               [userId, new Date().toISOString().split('T')[0], sugar, systolic, diastolic, heart, weight], () => {
            res.json({ success: true });
        });
    });
});

app.get('/api/vitals', (req, res) => {
    db.all("SELECT * FROM vitals ORDER BY date DESC LIMIT 10", (err, rows) => res.json({ success: true, vitals: rows || [] }));
});

app.post('/api/vitals', (req, res) => {
    const { userId, blood_sugar, systolic, diastolic, heart_rate, weight } = req.body;
    db.run("INSERT INTO vitals (user_id, date, blood_sugar, systolic, diastolic, heart_rate, weight) VALUES (?, ?, ?, ?, ?, ?, ?)", 
           [userId || 1, new Date().toISOString().split('T')[0], blood_sugar, systolic, diastolic, heart_rate, weight], () => {
        res.json({ success: true });
    });
});

app.post('/api/analyze-lab', (req, res) => {
    res.json({
        success: true,
        summary: "Your metabolic markers are stable. Fasting glucose is optimal. No immediate clinical intervention required.",
        suggestion: "Ensure 3 liters of water intake daily.",
        parameters: [
            { name: "Hemoglobin", value: "14.2", range: "13-17", status: "Normal" },
            { name: "Glucose (F)", value: "92", range: "70-100", status: "Normal" }
        ]
    });
});

app.post('/api/analyze-risk', (req, res) => {
    const { symptoms, vitals } = req.body;
    const isHigh = (symptoms || []).some(s => s.toLowerCase().includes('headache')) && (vitals.systolic > 140 || vitals.bp > 140);
    res.json({
        success: true,
        overallScore: isHigh ? 78 : 24,
        diabetesRisk: (vitals.sugar > 140 || vitals.blood_sugar > 140) ? "High" : "Low",
        cardiacRisk: isHigh ? "High" : "Optimal",
        suggestions: isHigh ? ["Consult doctor immediately", "Reduce salt intake"] : ["Maintain current lifestyle"]
    });
});

app.get('/api/maternal', (req, res) => {
    db.get("SELECT * FROM maternal ORDER BY id DESC LIMIT 1", (err, row) => {
        if (!row) return res.json({ success: false });
        res.json({ success: true, week: row.week, due_date: row.due_date, weight_gain: row.weight_gain, fetal_heart_rate: row.fetal_hr, iron_level: row.iron });
    });
});

app.post('/api/maternal', (req, res) => {
    const { week, due_date } = req.body;
    db.run("INSERT INTO maternal (user_id, week, due_date, weight_gain, fetal_hr, iron) VALUES (1, ?, ?, ?, ?, ?)", 
           [week, due_date, (week * 0.4).toFixed(1), 140, 12], () => res.json({ success: true }));
});

app.get('/api/child', (req, res) => {
    db.get("SELECT * FROM child ORDER BY id DESC LIMIT 1", (err, row) => {
        if (!row) return res.json({ success: false });
        res.json({ success: true, child_name: row.name, age_months: row.age_months, height_cm: row.height, weight_kg: row.weight });
    });
});

app.post('/api/child', (req, res) => {
    const { child_name, age_months } = req.body;
    db.run("INSERT INTO child (user_id, name, age_months, height, weight) VALUES (1, ?, ?, ?, ?)", 
           [child_name, age_months, 75, 10], () => res.json({ success: true }));
});

app.get('/api/notifications', (req, res) => {
    res.json({
        success: true,
        notifications: [{ id: 1, title: "Cardiology", message: "Tomorrow 10:30 AM", time: "2h ago", read: false }]
    });
});

app.post('/api/notifications/read', (req, res) => res.json({ success: true }));

app.use((req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

app.listen(PORT, () => console.log(`ArogyaPath Live on Port ${PORT}`));

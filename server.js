const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- SUPABASE SETUP ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://yafempnrcasbohhxjlng.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZmVtcG5yY2FzYm9oaHhqbG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDA3MjEsImV4cCI6MjA5NDE3NjcyMX0.bwH4P_jfNS2yLraFNW-uVrjzxe4h19mVePMel-lXp3c';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- FRONTEND ---
const frontendDir = path.join(__dirname, 'public');
app.use(express.static(frontendDir));

// --- API ENDPOINTS ---

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const { data, error } = await supabase.from('users').insert([{ name, email, password }]).select();
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, user: data[0] });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const { data: users, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
    if (!users || users.length === 0) return res.status(401).json({ success: false, error: "Invalid credentials" });
    
    const user = users[0];
    const { data: profiles } = await supabase.from('profiles').select('*').eq('user_id', user.id);
    res.json({ success: true, user, needsOnboarding: !profiles || profiles.length === 0 });
});

app.post('/api/onboarding', async (req, res) => {
    const { userId, age, gender, height, sugar, heart, systolic, diastolic, weight } = req.body;
    await supabase.from('profiles').insert([{ user_id: userId, age, gender, height }]);
    await supabase.from('vitals').insert([{ 
        user_id: userId, 
        date: new Date().toISOString().split('T')[0], 
        blood_sugar: sugar, 
        systolic, 
        diastolic, 
        heart_rate: heart, 
        weight 
    }]);
    res.json({ success: true });
});

app.get('/api/vitals', async (req, res) => {
    const { data, error } = await supabase.from('vitals').select('*').order('date', { ascending: false }).limit(10);
    res.json({ success: true, vitals: data || [] });
});

app.post('/api/vitals', async (req, res) => {
    const { userId, blood_sugar, systolic, diastolic, heart_rate, weight } = req.body;
    await supabase.from('vitals').insert([{ 
        user_id: userId || 1, 
        date: new Date().toISOString().split('T')[0], 
        blood_sugar, 
        systolic, 
        diastolic, 
        heart_rate, 
        weight 
    }]);
    res.json({ success: true });
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

app.get('/api/maternal', async (req, res) => {
    const { data, error } = await supabase.from('maternal').select('*').order('id', { ascending: false }).limit(1);
    if (!data || data.length === 0) return res.json({ success: false });
    const row = data[0];
    res.json({ success: true, week: row.week, due_date: row.due_date, weight_gain: row.weight_gain, fetal_heart_rate: row.fetal_hr, iron_level: row.iron });
});

app.post('/api/maternal', async (req, res) => {
    const { week, due_date } = req.body;
    await supabase.from('maternal').insert([{ user_id: 1, week, due_date, weight_gain: (week * 0.4).toFixed(1), fetal_hr: 140, iron: 12 }]);
    res.json({ success: true });
});

app.get('/api/child', async (req, res) => {
    const { data, error } = await supabase.from('child').select('*').order('id', { ascending: false }).limit(1);
    if (!data || data.length === 0) return res.json({ success: false });
    const row = data[0];
    res.json({ success: true, child_name: row.name, age_months: row.age_months, height_cm: row.height, weight_kg: row.weight });
});

app.post('/api/child', async (req, res) => {
    const { child_name, age_months } = req.body;
    await supabase.from('child').insert([{ user_id: 1, name: child_name, age_months, height: 75, weight: 10 }]);
    res.json({ success: true });
});

app.get('/api/notifications', (req, res) => {
    res.json({
        success: true,
        notifications: [{ id: 1, title: "Cardiology", message: "Tomorrow 10:30 AM", time: "2h ago", read: false }]
    });
});

app.use((req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

app.listen(PORT, () => console.log(`ArogyaPath Cloud Engine Live on Port ${PORT}`));

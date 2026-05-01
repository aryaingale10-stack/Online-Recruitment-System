const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',        // your WAMP MySQL password (usually empty for WAMP)
    database: 'recruitment_db'
});

// Test the connection
db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err);
        return;
    }
    console.log('Connected to recruitment_db successfully!');
});

// Test route - just to confirm server is running
app.get('/', (req, res) => {
    res.json({ message: 'Recruitment API is running!' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

// ─── JOB POSTINGS ───────────────────────────────────────

// GET all active job postings
app.get('/jobs', (req, res) => {
    const sql = `
        SELECT jp.job_id, jp.title, jp.location, jp.salary, 
               jp.deadline, ep.company_name
        FROM Job_Posting jp
        JOIN Employer_Profile ep ON jp.employer_id = ep.employer_id
        WHERE jp.status = 'Active'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ─── APPLICATIONS ────────────────────────────────────────

// GET all applications for a specific seeker
app.get('/applications/:seeker_id', (req, res) => {
    const sql = `
        SELECT a.application_id, jp.title, ep.company_name,
               a.application_date, a.status
        FROM Application a
        JOIN Job_Posting jp ON a.job_id = jp.job_id
        JOIN Employer_Profile ep ON jp.employer_id = ep.employer_id
        WHERE a.seeker_id = ?
    `;
    db.query(sql, [req.params.seeker_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST submit a new application
app.post('/applications', (req, res) => {
    const { job_id, seeker_id } = req.body;
    const sql = `
        INSERT INTO Application (job_id, seeker_id, application_date, status)
        VALUES (?, ?, CURDATE(), 'Submitted')
    `;
    db.query(sql, [job_id, seeker_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Application submitted!', application_id: results.insertId });
    });
});

// ─── USERS ───────────────────────────────────────────────

// POST register a new user
app.post('/register', (req, res) => {
    const { name, email, password, role_id } = req.body;
    const sql = `
        INSERT INTO Users (name, email, password, role_id)
        VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [name, email, password, role_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User registered!', user_id: results.insertId });
    });
});

// POST login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = `
        SELECT u.user_id, u.name, u.email, r.role_name
        FROM Users u
        JOIN Role r ON u.role_id = r.role_id
        WHERE u.email = ? AND u.password = ?
    `;
    db.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        res.json({ message: 'Login successful!', user: results[0] });
    });
});
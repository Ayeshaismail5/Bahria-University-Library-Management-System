const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db'); // import poolPromise and sql
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =========================
// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, studentid, role, phone } = req.body;

        // Default role to 'student' if not provided
        const userRole = role || 'student';

        if (!name || !email || !password || !studentid || !phone) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const pool = await poolPromise;

        // Check if user already exists
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if trying to create admin and one already exists
        if (userRole === 'admin') {
            const existingAdmin = await pool.request()
                .query('SELECT * FROM Users WHERE role = \'admin\'');

            if (existingAdmin.recordset.length > 0) {
                return res.status(400).json({ message: 'Admin user already exists. Only one admin is allowed.' });
            }
        }



        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user (id is auto-increment)
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('studentid', sql.NVarChar, studentid)
            .input('role', sql.NVarChar, userRole)
            .input('phone', sql.NVarChar, phone)
            .input('createdAt', sql.DateTime, new Date())
            .input('v', sql.Int, 1)
            .query(`INSERT INTO Users
                    (name, email, password, studentid, role, phone, createdAt, v)
                    VALUES (@name, @email, @password, @studentid, @role, @phone, @createdAt, @v)`);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error signing up:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const pool = await poolPromise;

        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = userResult.recordset[0];

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

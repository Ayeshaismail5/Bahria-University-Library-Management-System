const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const bcrypt = require('bcrypt');

const auth = require('../middleware/auth');

// =========================
// Get current user profile - protected
router.get('/profile', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT id, name, email, studentid, phone, role, createdAt FROM Users WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.recordset[0];
        res.json({
            _id: user.id.toString(),
            name: user.name,
            email: user.email,
            studentId: user.studentid,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Update current user profile - protected
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, req.user.id)
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .query('UPDATE Users SET name = @name, phone = @phone WHERE id = @id');

        // Fetch updated user
        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT id, name, email, studentid, phone, role, createdAt FROM Users WHERE id = @id');

        const user = result.recordset[0];
        res.json({
            _id: user.id.toString(),
            name: user.name,
            email: user.email,
            studentId: user.studentid,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Change password - protected
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const pool = await poolPromise;

        // Get current user with password
        const userResult = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT * FROM Users WHERE id = @id');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.recordset[0];

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.request()
            .input('id', sql.Int, req.user.id)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE id = @id');

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Get all members (students) - protected
router.get('/', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('role', sql.NVarChar, 'student') // filter by student role
            .query('SELECT id, name, email, studentid, phone, createdAt FROM Users WHERE role = @role');

        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single member by ID - protected
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT id, name, email, studentid, phone, createdAt FROM Users WHERE id = @id AND role = \'student\'');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const auth = require('../middleware/auth');

// Get all pending book requests (Admin only)
router.get('/pending', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                br.id, br.requestNote, br.status, br.requestDate,
                u.id as userId, u.name as userName, u.studentid, u.email,
                b.id as bookId, b.title as bookTitle, a.name as bookAuthor, c.name as bookCategory,
                b.available as bookAvailable,
                (SELECT COUNT(*) FROM Transactions WHERE userId = br.userId AND status = 'active') as currentBorrows
            FROM BookRequests br
            LEFT JOIN Users u ON br.userId = u.id
            LEFT JOIN Books b ON br.bookId = b.id
            LEFT JOIN Authors a ON b.authorId = a.id
            LEFT JOIN Categories c ON b.categoryId = c.id
            WHERE br.status = 'pending'
            ORDER BY br.requestDate ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching book requests:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own requests (Student)
router.get('/my-requests', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userID', sql.Int, userId)
            .query(`
                SELECT 
                    br.id, br.requestNote, br.status, br.requestDate, br.reviewDate, br.reviewNote,
                    b.id as bookId, b.title as bookTitle, a.name as bookAuthor, c.name as bookCategory
                FROM BookRequests br
                LEFT JOIN Books b ON br.bookId = b.id
                LEFT JOIN Authors a ON b.authorId = a.id
                LEFT JOIN Categories c ON b.categoryId = c.id
                WHERE br.userId = @userID
                ORDER BY br.requestDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching user requests:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve a book request (Admin only)
router.post('/approve/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const requestId = req.params.id;
        const adminId = req.user.id;
        const { reviewNote, dueDate } = req.body;

        const pool = await poolPromise;

        // Get the request details
        const requestResult = await pool.request()
            .input('requestID', sql.Int, requestId)
            .query('SELECT * FROM BookRequests WHERE id = @requestID');

        if (requestResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requestResult.recordset[0];

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        // Check if book is still available
        const bookResult = await pool.request()
            .input('bookID', sql.Int, request.bookId)
            .query('SELECT * FROM Books WHERE id = @bookID');

        if (bookResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const book = bookResult.recordset[0];
        if (book.available <= 0) {
            return res.status(400).json({ message: 'Book no longer available' });
        }

        // Create the transaction
        const defaultDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        
        await pool.request()
            .input('bookID', sql.Int, request.bookId)
            .input('userID', sql.Int, request.userId)
            .input('dueDate', sql.DateTime, defaultDueDate)
            .input('status', sql.VarChar, 'active')
            .query(`INSERT INTO Transactions 
                    (bookId, userId, type, transactionDate, dueDate, status)
                    VALUES (@bookID, @userID, 'borrow', GETDATE(), @dueDate, @status)`);

        // Update the request status
        await pool.request()
            .input('requestID', sql.Int, requestId)
            .input('adminID', sql.Int, adminId)
            .input('reviewNote', sql.NVarChar(500), reviewNote || 'Approved')
            .query(`UPDATE BookRequests 
                    SET status = 'approved', reviewedBy = @adminID, 
                        reviewDate = GETDATE(), reviewNote = @reviewNote 
                    WHERE id = @requestID`);

        res.json({ message: 'Request approved and book issued successfully' });
    } catch (err) {
        console.error('Error approving request:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject a book request (Admin only)
router.post('/reject/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const requestId = req.params.id;
        const adminId = req.user.id;
        const { reviewNote } = req.body;

        const pool = await poolPromise;

        // Get the request details
        const requestResult = await pool.request()
            .input('requestID', sql.Int, requestId)
            .query('SELECT * FROM BookRequests WHERE id = @requestID');

        if (requestResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requestResult.recordset[0];

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        // Update the request status
        await pool.request()
            .input('requestID', sql.Int, requestId)
            .input('adminID', sql.Int, adminId)
            .input('reviewNote', sql.NVarChar(500), reviewNote || 'Rejected')
            .query(`UPDATE BookRequests 
                    SET status = 'rejected', reviewedBy = @adminID, 
                        reviewDate = GETDATE(), reviewNote = @reviewNote 
                    WHERE id = @requestID`);

        res.json({ message: 'Request rejected successfully' });
    } catch (err) {
        console.error('Error rejecting request:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

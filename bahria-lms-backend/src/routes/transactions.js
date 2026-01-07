const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

const auth = require('../middleware/auth');

// =========================
// Issue a book
router.post('/issue', auth, async (req, res) => {
    try {
        const { bookID, userID, duedate } = req.body;

        if (!bookID || !userID || !duedate) {
            return res.status(400).json({ message: 'Please provide bookID, userID, and duedate' });
        }

        const pool = await poolPromise;

        // Check if book exists and has available copies
        const bookResult = await pool.request()
            .input('bookID', sql.Int, bookID)
            .query('SELECT * FROM Books WHERE id = @bookID');

        if (bookResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const book = bookResult.recordset[0];
        if (book.available <= 0) {
            return res.status(400).json({ message: 'No copies available to issue' });
        }

        // Check if user already has this book borrowed
        const existingBorrow = await pool.request()
            .input('bookID', sql.Int, bookID)
            .input('userID', sql.Int, userID)
            .query(`SELECT * FROM Transactions 
                    WHERE bookId = @bookID AND userId = @userID AND status = 'active'`);

        if (existingBorrow.recordset.length > 0) {
            return res.status(400).json({ message: 'User already has this book borrowed' });
        }

        // Check if user recently returned this book (2-day cooldown)
        const recentReturn = await pool.request()
            .input('bookID', sql.Int, bookID)
            .input('userID', sql.Int, userID)
            .query(`SELECT * FROM Transactions 
                    WHERE bookId = @bookID AND userId = @userID 
                    AND status = 'returned' 
                    AND returnDate > DATEADD(day, -2, GETDATE())`);

        if (recentReturn.recordset.length > 0) {
            return res.status(400).json({ message: 'Please wait 2 days before borrowing this book again' });
        }

        // Insert transaction (trigger will auto-update book availability)
        await pool.request()
            .input('bookID', sql.Int, bookID)
            .input('userID', sql.Int, userID)
            .input('dueDate', sql.DateTime, duedate)
            .input('status', sql.VarChar, 'active')
            .query(`INSERT INTO Transactions 
                    (bookId, userId, type, transactionDate, dueDate, status)
                    VALUES (@bookID, @userID, 'borrow', GETDATE(), @dueDate, @status)`);

        res.json({ message: 'Book issued successfully' });
    } catch (err) {
        console.error('Error issuing book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Return a book
router.post('/return', auth, async (req, res) => {
    try {
        const { transactionID } = req.body;

        if (!transactionID) return res.status(400).json({ message: 'Please provide transactionID' });

        const pool = await poolPromise;

        // Get transaction
        const transResult = await pool.request()
            .input('transactionID', sql.Int, transactionID)
            .query('SELECT * FROM Transactions WHERE id = @transactionID');

        if (transResult.recordset.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        const transaction = transResult.recordset[0];

        if (transaction.status === 'returned') {
            return res.status(400).json({ message: 'Book already returned' });
        }

        const today = new Date();
        const dueDate = new Date(transaction.dueDate);
        let fine = 0;

        // Calculate fine (10 Rs per day)
        if (today > dueDate) {
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysOverdue * 10;
        }

        // Update transaction (trigger will auto-update book availability)
        await pool.request()
            .input('transactionID', sql.Int, transactionID)
            .input('returnDate', sql.DateTime, today)
            .input('status', sql.VarChar, 'returned')
            .query('UPDATE Transactions SET returnDate=@returnDate, status=@status WHERE id=@transactionID');

        res.json({ 
            message: fine > 0 ? `Book returned successfully. Fine: Rs. ${fine}` : 'Book returned successfully',
            fine: fine
        });
    } catch (err) {
        console.error('Error returning book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Get all transactions (protected)
router.get('/', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, u.name as userName, u.studentid as userStudentId, 
                   b.title as bookTitle, a.name as bookAuthor, c.name as bookCategory
            FROM Transactions t
            LEFT JOIN Users u ON t.userId = u.id
            LEFT JOIN Books b ON t.bookId = b.id
            LEFT JOIN Authors a ON b.authorId = a.id
            LEFT JOIN Categories c ON b.categoryId = c.id
            ORDER BY t.id DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Get current user's transactions (for students)
router.get('/my', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT t.*, b.title as bookTitle, a.name as bookAuthor, c.name as bookCategory
                FROM Transactions t
                LEFT JOIN Books b ON t.bookId = b.id
                LEFT JOIN Authors a ON b.authorId = a.id
                LEFT JOIN Categories c ON b.categoryId = c.id
                WHERE t.userId = @userId
                ORDER BY t.transactionDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching user transactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Student borrow a book (uses JWT to get user)
router.post('/', auth, async (req, res) => {
    try {
        const { bookId, requestNote } = req.body;
        const userId = req.user.id; // Get user ID from JWT

        if (!bookId) {
            return res.status(400).json({ message: 'Please provide bookId' });
        }

        const pool = await poolPromise;

        // Check if book exists and has available copies
        const bookResult = await pool.request()
            .input('bookID', sql.Int, bookId)
            .query('SELECT * FROM Books WHERE id = @bookID');

        if (bookResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const book = bookResult.recordset[0];
        if (book.available <= 0) {
            return res.status(400).json({ message: 'No copies available to borrow' });
        }

        // Check if user already has this book borrowed
        const existingBorrow = await pool.request()
            .input('bookID', sql.Int, bookId)
            .input('userID', sql.Int, userId)
            .query(`SELECT * FROM Transactions 
                    WHERE bookId = @bookID AND userId = @userID AND status = 'active'`);

        if (existingBorrow.recordset.length > 0) {
            return res.status(400).json({ message: 'You already have this book borrowed' });
        }

        // Check if user recently returned this book (2-day cooldown)
        const recentReturn = await pool.request()
            .input('bookID', sql.Int, bookId)
            .input('userID', sql.Int, userId)
            .query(`SELECT * FROM Transactions 
                    WHERE bookId = @bookID AND userId = @userID 
                    AND status = 'returned' 
                    AND returnDate > DATEADD(day, -2, GETDATE())`);

        if (recentReturn.recordset.length > 0) {
            return res.status(400).json({ message: 'Please wait 2 days before borrowing this book again' });
        }

        // Check how many books user currently has borrowed
        const borrowCountResult = await pool.request()
            .input('userID', sql.Int, userId)
            .query(`SELECT COUNT(*) as count FROM Transactions 
                    WHERE userId = @userID AND status = 'active'`);

        const currentBorrowCount = borrowCountResult.recordset[0].count;

        // If user has 2+ books, create a request instead of direct borrow
        if (currentBorrowCount >= 2) {
            // Check if there's already a pending request for this book
            const existingRequest = await pool.request()
                .input('bookID', sql.Int, bookId)
                .input('userID', sql.Int, userId)
                .query(`SELECT * FROM BookRequests 
                        WHERE bookId = @bookID AND userId = @userID AND status = 'pending'`);

            if (existingRequest.recordset.length > 0) {
                return res.status(400).json({ message: 'You already have a pending request for this book' });
            }

            // Create a book request
            await pool.request()
                .input('bookID', sql.Int, bookId)
                .input('userID', sql.Int, userId)
                .input('requestNote', sql.NVarChar(500), requestNote || 'No note provided')
                .query(`INSERT INTO BookRequests (userId, bookId, requestNote, status, requestDate)
                        VALUES (@userID, @bookID, @requestNote, 'pending', GETDATE())`);

            return res.status(200).json({ 
                message: 'Request submitted for admin approval. You already have 2 books borrowed.',
                requiresApproval: true 
            });
        }

        // Direct borrow for users with less than 2 books
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // Insert transaction (trigger will auto-update book availability)
        await pool.request()
            .input('bookID', sql.Int, bookId)
            .input('userID', sql.Int, userId)
            .input('dueDate', sql.DateTime, dueDate)
            .input('status', sql.VarChar, 'active')
            .query(`INSERT INTO Transactions 
                    (bookId, userId, type, transactionDate, dueDate, status)
                    VALUES (@bookID, @userID, 'borrow', GETDATE(), @dueDate, @status)`);

        res.status(201).json({ message: 'Book borrowed successfully' });
    } catch (err) {
        console.error('Error borrowing book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// Student return a book (uses JWT to get user)
router.put('/return/:id', auth, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user.id; // Get user ID from JWT

        const pool = await poolPromise;

        // Get transaction and verify it belongs to this user
        const transResult = await pool.request()
            .input('transactionID', sql.Int, transactionId)
            .input('userID', sql.Int, userId)
            .query('SELECT * FROM Transactions WHERE id = @transactionID AND userId = @userID');

        if (transResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Transaction not found or does not belong to you' });
        }

        const transaction = transResult.recordset[0];

        if (transaction.status === 'returned') {
            return res.status(400).json({ message: 'Book already returned' });
        }

        const today = new Date();
        const dueDate = new Date(transaction.dueDate);
        let fine = 0;

        // Calculate fine (10 Rs per day)
        if (today > dueDate) {
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysOverdue * 10;
        }

        // Update transaction (trigger will auto-update book availability)
        await pool.request()
            .input('transactionID', sql.Int, transactionId)
            .input('returnDate', sql.DateTime, today)
            .input('status', sql.VarChar, 'returned')
            .query('UPDATE Transactions SET returnDate=@returnDate, status=@status WHERE id=@transactionID');

        res.json({ 
            message: fine > 0 ? `Book returned successfully. Fine: Rs. ${fine}` : 'Book returned successfully',
            fine: fine
        });
    } catch (err) {
        console.error('Error returning book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

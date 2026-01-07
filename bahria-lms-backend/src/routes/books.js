const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const auth = require('../middleware/auth');

// =========================
// GET all authors (for dropdowns)
router.get('/authors', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM Authors ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching authors:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// GET all categories (for dropdowns)
router.get('/categories', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM Categories ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// GET all publishers (for dropdowns)
router.get('/publishers', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, name FROM Publishers ORDER BY name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching publishers:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// GET all books (protected)
router.get('/', auth, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`SELECT b.id, b.title, b.isbn, b.publishYear, b.quantity, b.available, 
                           b.description, b.coverImage, b.createdAt,
                           a.name AS author, c.name AS category, p.name AS publisher
                    FROM Books b
                    INNER JOIN Authors a ON b.authorId = a.id
                    LEFT JOIN Categories c ON b.categoryId = c.id
                    LEFT JOIN Publishers p ON b.publisherId = p.id
                    ORDER BY b.id`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// GET book by ID (protected)
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT b.id, b.title, b.isbn, b.publishYear, b.quantity, b.available, 
                           b.description, b.coverImage, b.createdAt, b.authorId, b.categoryId, b.publisherId,
                           a.name AS author, c.name AS category, p.name AS publisher
                    FROM Books b
                    INNER JOIN Authors a ON b.authorId = a.id
                    LEFT JOIN Categories c ON b.categoryId = c.id
                    LEFT JOIN Publishers p ON b.publisherId = p.id
                    WHERE b.id = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching book by ID:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// ADD a new book (protected)
router.post('/', auth, async (req, res) => {
    try {
        const { title, authorId, isbn, categoryId, publisherId, quantity, description, publishYear } = req.body;

        if (!title || !authorId || !isbn || quantity == null) {
            return res.status(400).json({ message: 'Please provide all required fields (title, authorId, isbn, quantity)' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('title', sql.NVarChar, title)
            .input('authorId', sql.Int, authorId)
            .input('isbn', sql.NVarChar, isbn)
            .input('categoryId', sql.Int, categoryId || null)
            .input('publisherId', sql.Int, publisherId || null)
            .input('publishYear', sql.Int, publishYear || null)
            .input('quantity', sql.Int, quantity)
            .input('available', sql.Int, quantity)
            .input('description', sql.NVarChar, description || '')
            .query(`INSERT INTO Books 
                    (title, authorId, isbn, categoryId, publisherId, publishYear, quantity, available, description, createdAt) 
                    VALUES (@title, @authorId, @isbn, @categoryId, @publisherId, @publishYear, @quantity, @available, @description, GETDATE())`);

        res.status(201).json({ message: 'Book added successfully' });
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// UPDATE a book by ID (protected)
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, authorId, isbn, categoryId, publisherId, quantity, available, description, publishYear } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, title)
            .input('authorId', sql.Int, authorId)
            .input('isbn', sql.NVarChar, isbn)
            .input('categoryId', sql.Int, categoryId || null)
            .input('publisherId', sql.Int, publisherId || null)
            .input('publishYear', sql.Int, publishYear || null)
            .input('quantity', sql.Int, quantity)
            .input('available', sql.Int, available)
            .input('description', sql.NVarChar, description || '')
            .query(`UPDATE Books
                    SET title=@title, authorId=@authorId, isbn=@isbn,
                        categoryId=@categoryId, publisherId=@publisherId, publishYear=@publishYear,
                        quantity=@quantity, available=@available, description=@description
                    WHERE id=@id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json({ message: 'Book updated successfully' });
    } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================
// DELETE a book by ID (protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if book has active transactions
        const activeTransactions = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT COUNT(*) as count FROM Transactions 
                    WHERE bookId = @id AND status = 'active'`);

        if (activeTransactions.recordset[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete book. It has active borrows. Please wait for all copies to be returned.' 
            });
        }

        // Delete related records first (in order of dependencies)
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM BookRequests WHERE bookId = @id');

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Reviews WHERE bookId = @id');

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Reservations WHERE bookId = @id');

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Transactions WHERE bookId = @id');

        // Now delete the book
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Books WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;

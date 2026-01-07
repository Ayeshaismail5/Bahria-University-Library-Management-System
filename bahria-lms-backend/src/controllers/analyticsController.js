const { poolPromise, sql } = require('../db');

// =========================
// Get Book Inventory View
// =========================
exports.getBookInventory = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_BookInventory ORDER BY title');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching book inventory:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Active Transactions View
// =========================
exports.getActiveTransactions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_ActiveTransactions ORDER BY dueDate');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching active transactions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get User Borrowing Statistics View
// =========================
exports.getUserBorrowingStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_UserBorrowingStats ORDER BY totalTransactions DESC');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Popular Books View
// =========================
exports.getPopularBooks = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_PopularBooks ORDER BY totalBorrows DESC');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching popular books:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Category Statistics View
// =========================
exports.getCategoryStats = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_CategoryStats ORDER BY totalBooks DESC');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching category stats:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Overdue Transactions View
// =========================
exports.getOverdueTransactions = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_OverdueTransactions ORDER BY daysOverdue DESC');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching overdue transactions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Monthly Transaction Summary View
// =========================
exports.getMonthlyTransactionSummary = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM vw_MonthlyTransactionSummary ORDER BY transactionYear DESC, transactionMonth DESC');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching monthly summary:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Borrow Book using Stored Procedure
// =========================
exports.borrowBookProcedure = async (req, res) => {
    try {
        const { userId, bookId, dueDate } = req.body;

        if (!userId || !bookId || !dueDate) {
            return res.status(400).json({ message: 'Please provide userId, bookId, and dueDate' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('bookId', sql.Int, bookId)
            .input('dueDate', sql.DateTime, new Date(dueDate))
            .output('message', sql.NVarChar(500))
            .output('success', sql.Bit)
            .execute('sp_BorrowBook');

        const success = result.output.success;
        const message = result.output.message;

        if (success) {
            res.json({ success: true, message });
        } else {
            res.status(400).json({ success: false, message });
        }
    } catch (err) {
        console.error('Error borrowing book:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Return Book using Stored Procedure
// =========================
exports.returnBookProcedure = async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ message: 'Please provide transactionId' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('transactionId', sql.Int, transactionId)
            .output('fineAmount', sql.Decimal(10, 2))
            .output('message', sql.NVarChar(500))
            .output('success', sql.Bit)
            .execute('sp_ReturnBook');

        const success = result.output.success;
        const message = result.output.message;
        const fineAmount = result.output.fineAmount;

        if (success) {
            res.json({ success: true, message, fineAmount });
        } else {
            res.status(400).json({ success: false, message });
        }
    } catch (err) {
        console.error('Error returning book:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get User Dashboard using Stored Procedure
// =========================
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.params.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .execute('sp_GetUserDashboard');

        // The stored procedure returns multiple result sets
        const userStats = result.recordsets[0][0];
        const activeTransactions = result.recordsets[1];

        res.json({
            userStats,
            activeTransactions
        });
    } catch (err) {
        console.error('Error fetching user dashboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Admin Dashboard using Stored Procedure
// =========================
exports.getAdminDashboard = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetAdminDashboard');

        // The stored procedure returns multiple result sets
        const overallStats = result.recordsets[0][0];
        const recentTransactions = result.recordsets[1];
        const topBooks = result.recordsets[2];
        const categoryDistribution = result.recordsets[3];

        res.json({
            overallStats,
            recentTransactions,
            topBooks,
            categoryDistribution
        });
    } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Search Books using Stored Procedure
// =========================
exports.searchBooksProcedure = async (req, res) => {
    try {
        const { searchTerm, category, availableOnly } = req.query;

        const pool = await poolPromise;
        const request = pool.request();

        if (searchTerm) {
            request.input('searchTerm', sql.NVarChar(255), searchTerm);
        }
        if (category) {
            request.input('category', sql.NVarChar(100), category);
        }
        request.input('availableOnly', sql.Bit, availableOnly === 'true' ? 1 : 0);

        const result = await request.execute('sp_SearchBooks');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error searching books:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Transaction History using Stored Procedure
// =========================
exports.getTransactionHistory = async (req, res) => {
    try {
        const { userId, bookId, status, startDate, endDate } = req.query;

        const pool = await poolPromise;
        const request = pool.request();

        if (userId) {
            request.input('userId', sql.Int, parseInt(userId));
        }
        if (bookId) {
            request.input('bookId', sql.Int, parseInt(bookId));
        }
        if (status) {
            request.input('status', sql.NVarChar(20), status);
        }
        if (startDate) {
            request.input('startDate', sql.DateTime, new Date(startDate));
        }
        if (endDate) {
            request.input('endDate', sql.DateTime, new Date(endDate));
        }

        const result = await request.execute('sp_GetTransactionHistory');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching transaction history:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get Book Audit Log
// =========================
exports.getBookAuditLog = async (req, res) => {
    try {
        const { bookId } = req.query;
        
        const pool = await poolPromise;
        const request = pool.request();
        
        let query = 'SELECT * FROM BookAuditLog';
        
        if (bookId) {
            query += ' WHERE bookId = @bookId';
            request.input('bookId', sql.Int, parseInt(bookId));
        }
        
        query += ' ORDER BY changedAt DESC';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching book audit log:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Get User Audit Log
// =========================
exports.getUserAuditLog = async (req, res) => {
    try {
        const { userId } = req.query;
        
        const pool = await poolPromise;
        const request = pool.request();
        
        let query = 'SELECT * FROM UserAuditLog';
        
        if (userId) {
            query += ' WHERE userId = @userId';
            request.input('userId', sql.Int, parseInt(userId));
        }
        
        query += ' ORDER BY actionDate DESC';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching user audit log:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// =========================
// Calculate Fine using Function
// =========================
exports.calculateFine = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('transactionId', sql.Int, transactionId)
            .query('SELECT dbo.fn_CalculateFine(@transactionId) AS fine');

        res.json({ transactionId, fine: result.recordset[0].fine });
    } catch (err) {
        console.error('Error calculating fine:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

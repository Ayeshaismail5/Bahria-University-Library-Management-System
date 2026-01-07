const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// =========================
// SQL VIEWS ENDPOINTS
// =========================

// Get book inventory with availability status
router.get('/views/book-inventory', auth, analyticsController.getBookInventory);

// Get all active transactions with user and book details
router.get('/views/active-transactions', auth, analyticsController.getActiveTransactions);

// Get user borrowing statistics
router.get('/views/user-stats', auth, analyticsController.getUserBorrowingStats);

// Get popular books ranked by borrows
router.get('/views/popular-books', auth, analyticsController.getPopularBooks);

// Get category-wise book statistics
router.get('/views/category-stats', auth, analyticsController.getCategoryStats);

// Get overdue transactions with fine calculations
router.get('/views/overdue-transactions', auth, analyticsController.getOverdueTransactions);

// Get monthly transaction summary
router.get('/views/monthly-summary', auth, analyticsController.getMonthlyTransactionSummary);

// =========================
// STORED PROCEDURES ENDPOINTS
// =========================

// Borrow book using stored procedure (with validations)
router.post('/procedures/borrow-book', auth, analyticsController.borrowBookProcedure);

// Return book using stored procedure (with fine calculation)
router.post('/procedures/return-book', auth, analyticsController.returnBookProcedure);

// Get user dashboard statistics
router.get('/procedures/user-dashboard/:userId', auth, analyticsController.getUserDashboard);

// Get admin dashboard statistics
router.get('/procedures/admin-dashboard', auth, analyticsController.getAdminDashboard);

// Search books with advanced filters
router.get('/procedures/search-books', auth, analyticsController.searchBooksProcedure);

// Get transaction history with filters
router.get('/procedures/transaction-history', auth, analyticsController.getTransactionHistory);

// =========================
// AUDIT LOGS ENDPOINTS
// =========================

// Get book audit log
router.get('/audit/books', auth, analyticsController.getBookAuditLog);

// Get user audit log
router.get('/audit/users', auth, analyticsController.getUserAuditLog);

// =========================
// FUNCTIONS ENDPOINTS
// =========================

// Calculate fine for a transaction
router.get('/functions/calculate-fine/:transactionId', auth, analyticsController.calculateFine);

module.exports = router;

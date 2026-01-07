# Advanced SQL Features Documentation

## Overview
This project demonstrates advanced DBMS concepts including **SQL Views**, **Stored Procedures**, **Joins**, **Triggers**, **Functions**, and **Normalized Schema Design**.

---

## 📊 Database Schema

### Core Tables
1. **Users** - Student and admin accounts
2. **Authors** - Book authors (normalized)
3. **Publishers** - Publishing companies
4. **Categories** - Book categories
5. **Books** - Book inventory with foreign keys
6. **Transactions** - Borrowing/returning records
7. **Fines** - Fine management
8. **Reservations** - Book reservations
9. **Reviews** - User book reviews
10. **BookAuditLog** - Audit trail for book changes
11. **UserAuditLog** - User activity tracking

---

## 🔍 SQL VIEWS (with JOINS)

### 1. vw_BookDetails
**Purpose**: Complete book information with JOIN operations  
**Joins**: Books → Authors → Publishers → Categories  
```sql
SELECT * FROM vw_BookDetails;
```
**Use Case**: Display books with author, publisher, and category names

### 2. vw_TransactionDetails
**Purpose**: Transaction history with user and book details  
**Joins**: Transactions → Users → Books → Authors → Categories  
```sql
SELECT * FROM vw_TransactionDetails WHERE status = 'active';
```
**Use Case**: Show borrowed books with borrower and book information

### 3. vw_UserStats
**Purpose**: User borrowing statistics and fines  
**Aggregations**: COUNT, SUM with GROUP BY  
```sql
SELECT * FROM vw_UserStats ORDER BY totalBorrows DESC;
```
**Use Case**: Display user activity dashboard

### 4. vw_BookPopularity
**Purpose**: Book rankings by borrows and reviews  
**Aggregations**: COUNT, AVG with LEFT JOIN  
```sql
SELECT TOP 10 * FROM vw_BookPopularity ORDER BY borrowCount DESC;
```
**Use Case**: Show most popular books

### 5. vw_BookInventory (from advanced-schema.sql)
**Purpose**: Book availability status with calculations  
```sql
SELECT * FROM vw_BookInventory WHERE stockStatus = 'Low Stock';
```

### 6. vw_ActiveTransactions (from advanced-schema.sql)
**Purpose**: Currently borrowed books with due date calculations  
```sql
SELECT * FROM vw_ActiveTransactions WHERE transactionStatus = 'Overdue';
```

### 7. vw_OverdueTransactions (from advanced-schema.sql)
**Purpose**: Overdue books with fine calculations  
```sql
SELECT * FROM vw_OverdueTransactions ORDER BY daysOverdue DESC;
```

---

## ⚙️ STORED PROCEDURES

### 1. sp_BorrowBookEnhanced
**Purpose**: Borrow book with complete validation logic  
**Features**:
- User and book existence validation
- Availability check
- Borrowing limit (max 3 books)
- Unpaid fines check
- Transaction creation
- Automatic availability update

**Usage**:
```sql
EXEC sp_BorrowBookEnhanced 
    @userId = 1, 
    @bookId = 5, 
    @daysToReturn = 14;
```

### 2. sp_BorrowBook (from advanced-schema.sql)
**Purpose**: Enhanced borrowing with output parameters  
**Usage**:
```sql
DECLARE @msg NVARCHAR(500), @success BIT;
EXEC sp_BorrowBook 
    @userId = 1, 
    @bookId = 5, 
    @dueDate = '2025-01-10',
    @message = @msg OUTPUT,
    @success = @success OUTPUT;
SELECT @msg, @success;
```

### 3. sp_ReturnBook (from advanced-schema.sql)
**Purpose**: Return book with fine calculation  
**Usage**:
```sql
DECLARE @fine DECIMAL(10,2), @msg NVARCHAR(500), @success BIT;
EXEC sp_ReturnBook 
    @transactionId = 10,
    @fineAmount = @fine OUTPUT,
    @message = @msg OUTPUT,
    @success = @success OUTPUT;
SELECT @fine AS FineAmount, @msg AS Message;
```

### 4. sp_AdminDashboard
**Purpose**: Complete admin statistics  
**Returns**: Multiple result sets
- Overall statistics
- Top 5 books
- Recent transactions

**Usage**:
```sql
EXEC sp_AdminDashboard;
```

### 5. sp_GetUserDashboard (from advanced-schema.sql)
**Purpose**: User-specific dashboard  
**Usage**:
```sql
EXEC sp_GetUserDashboard @userId = 2;
```

### 6. sp_SearchBooks (from advanced-schema.sql)
**Purpose**: Advanced book search with filters  
**Usage**:
```sql
EXEC sp_SearchBooks 
    @searchTerm = 'algorithm',
    @category = 'Computer Science',
    @availableOnly = 1;
```

### 7. sp_GetTransactionHistory (from advanced-schema.sql)
**Purpose**: Filtered transaction history  
**Usage**:
```sql
EXEC sp_GetTransactionHistory 
    @userId = 2,
    @status = 'returned',
    @startDate = '2025-01-01';
```

---

## ⚡ TRIGGERS

### 1. trg_CreateFineOnReturn
**Type**: AFTER UPDATE  
**Purpose**: Auto-create fine when book returned late  
**Logic**: Calculates fine (Rs. 10/day) for overdue returns  
```sql
-- Automatically triggered when transaction status changes to 'returned'
```

### 2. trg_PreventBookDelete
**Type**: INSTEAD OF DELETE  
**Purpose**: Prevent deletion of books with active loans  
**Logic**: Blocks deletion if active transactions exist  
```sql
DELETE FROM Books WHERE id = 5; -- Will fail if book has active loans
```

### 3. trg_UpdateBookAvailability
**Type**: AFTER INSERT, UPDATE  
**Purpose**: Auto-update book availability on transactions  
**Logic**: Decreases on borrow, increases on return  
```sql
-- Automatically triggered on transaction insert/update
```

### 4. trg_UpdateOverdueStatus (from advanced-schema.sql)
**Type**: AFTER INSERT, UPDATE  
**Purpose**: Mark transactions as overdue automatically  
```sql
-- Runs when transaction is inserted or updated
```

### 5. trg_AuditBookChanges (from advanced-schema.sql)
**Type**: AFTER UPDATE  
**Purpose**: Log all book quantity/availability changes  
```sql
UPDATE Books SET quantity = 10 WHERE id = 1;
-- Check audit: SELECT * FROM BookAuditLog WHERE bookId = 1;
```

### 6. trg_AuditUserRegistration (from advanced-schema.sql)
**Type**: AFTER INSERT  
**Purpose**: Log new user registrations  
```sql
-- Automatically logs new users to UserAuditLog
```

---

## 🔧 FUNCTIONS

### fn_CalculateFine
**Purpose**: Calculate fine for any transaction  
**Returns**: DECIMAL(10,2)  
**Usage**:
```sql
SELECT dbo.fn_CalculateFine(transactionId) AS Fine;
SELECT id, dbo.fn_CalculateFine(id) AS Fine 
FROM Transactions 
WHERE status = 'active';
```

---

## 🌐 API Endpoints

### Views Endpoints
```
GET /api/analytics/views/book-inventory
GET /api/analytics/views/active-transactions
GET /api/analytics/views/user-stats
GET /api/analytics/views/popular-books
GET /api/analytics/views/category-stats
GET /api/analytics/views/overdue-transactions
GET /api/analytics/views/monthly-summary
```

### Procedures Endpoints
```
POST /api/analytics/procedures/borrow-book
POST /api/analytics/procedures/return-book
GET  /api/analytics/procedures/user-dashboard/:userId
GET  /api/analytics/procedures/admin-dashboard
GET  /api/analytics/procedures/search-books
GET  /api/analytics/procedures/transaction-history
```

### Audit Endpoints
```
GET /api/analytics/audit/books
GET /api/analytics/audit/users
```

### Functions Endpoints
```
GET /api/analytics/functions/calculate-fine/:transactionId
```

---

## 🚀 Setup Instructions

### 1. Run Enhanced Schema
```bash
# Navigate to backend
cd bahria-lms-backend

# Execute the enhanced schema
# Option A: Run enhanced-schema.sql in your SQL Server
# Option B: Run advanced-schema.sql for additional features
```

### 2. Both files include:
- ✅ All table definitions
- ✅ Views with JOINS
- ✅ Stored Procedures
- ✅ Triggers
- ✅ Functions
- ✅ Complete seed data
- ✅ Indexes for performance

### 3. Start Backend
```bash
npm install
npm start
```

### 4. Test Endpoints
```bash
# Test views
curl http://localhost:5000/api/analytics/views/popular-books

# Test procedures
curl -X POST http://localhost:5000/api/analytics/procedures/borrow-book \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "bookId": 5, "dueDate": "2025-01-15"}'
```

---

## 📱 Frontend Features

### Admin Analytics Dashboard
Location: `src/pages/admin/AnalyticsDashboard.tsx`

**Features**:
- Overall statistics cards
- Popular books table (from View)
- Category distribution (from View)
- Overdue transactions (from View with fine calculation)
- Uses multiple SQL Views with JOINS

**Access**: Admin login → Analytics Dashboard

---

## 🎯 DBMS Concepts Demonstrated

### ✅ Normalization
- Authors, Publishers, Categories separated into their own tables
- Books reference foreign keys (authorId, publisherId, categoryId)
- Reduces redundancy and maintains data integrity

### ✅ JOINS (Multiple Types)
- **INNER JOIN**: vw_BookDetails (Books + Authors + Publishers + Categories)
- **LEFT JOIN**: vw_BookPopularity (Books + optional Transactions/Reviews)
- **Multiple JOINS**: vw_TransactionDetails (4-table join)

### ✅ Aggregations
- COUNT, SUM, AVG in views
- GROUP BY in statistics views
- HAVING clauses for filtering

### ✅ Subqueries
- Used in stored procedures for validation
- Nested SELECT in dashboard procedures

### ✅ Transactions (ACID)
- BEGIN TRANSACTION / COMMIT / ROLLBACK
- Used in sp_BorrowBookEnhanced for data integrity

### ✅ Constraints
- PRIMARY KEY, FOREIGN KEY
- CHECK constraints (rating, status)
- UNIQUE constraints (email, ISBN)

### ✅ Indexes
- NONCLUSTERED indexes on foreign keys
- Composite indexes for common queries

---

## 📈 Performance Features

1. **Indexes**: Created on frequently queried columns
2. **Views**: Pre-joined data for faster reads
3. **Stored Procedures**: Compiled execution plans
4. **Triggers**: Automatic data maintenance

---

## 🧪 Testing Queries

```sql
-- Test View with JOIN
SELECT * FROM vw_BookDetails WHERE authorName LIKE '%Cormen%';

-- Test Stored Procedure
EXEC sp_BorrowBookEnhanced @userId = 2, @bookId = 3;

-- Test Trigger (audit log)
UPDATE Books SET quantity = 20 WHERE id = 1;
SELECT * FROM BookAuditLog WHERE bookId = 1;

-- Test Function
SELECT id, title, dbo.fn_CalculateFine(id) AS Fine 
FROM Transactions WHERE status = 'active';

-- Test Complex JOIN
SELECT 
    u.name, 
    b.title, 
    a.name AS author,
    t.dueDate,
    DATEDIFF(day, t.dueDate, GETDATE()) AS daysOverdue
FROM Transactions t
INNER JOIN Users u ON t.userId = u.id
INNER JOIN Books b ON t.bookId = b.id
INNER JOIN Authors a ON b.authorId = a.id
WHERE t.status = 'active' AND GETDATE() > t.dueDate;
```

---

## 📝 Notes

- All passwords in seed data: `admin123` (hashed with bcrypt)
- Fine rate: Rs. 10 per day
- Borrowing limit: 3 books per user
- Default loan period: 14 days
- Both `enhanced-schema.sql` and `advanced-schema.sql` are complete and can be used independently

---

## 🎓 Educational Value

This project demonstrates:
1. ✅ **Normalized database design** (3NF)
2. ✅ **Complex SQL JOINs** (INNER, LEFT, multi-table)
3. ✅ **Views** for data abstraction
4. ✅ **Stored Procedures** for business logic
5. ✅ **Triggers** for automatic operations
6. ✅ **Functions** for calculations
7. ✅ **Transactions** for ACID compliance
8. ✅ **Audit trails** for tracking changes
9. ✅ **Full-stack integration** (SQL → API → React)

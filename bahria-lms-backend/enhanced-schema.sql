-- ============================================
-- ENHANCED BAHRIA LIBRARY MANAGEMENT SYSTEM
-- With Additional Tables and Advanced SQL Features
-- ============================================

-- ============================================
-- CORE TABLES (Complete Schema)
-- ============================================

-- Users Table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    studentid NVARCHAR(50) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin')),
    phone NVARCHAR(20) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    v INT DEFAULT 1
);
GO

-- Authors Table (Normalized)
CREATE TABLE Authors (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    biography NVARCHAR(MAX),
    country NVARCHAR(100),
    createdAt DATETIME DEFAULT GETDATE()
);
GO

-- Publishers Table
CREATE TABLE Publishers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500),
    phone NVARCHAR(20),
    email NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE()
);
GO

-- Categories Table
CREATE TABLE Categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE()
);
GO

-- Enhanced Books Table with Foreign Keys
CREATE TABLE Books (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    authorId INT NOT NULL,
    publisherId INT,
    categoryId INT,
    isbn NVARCHAR(50) UNIQUE,
    publishYear INT,
    quantity INT NOT NULL DEFAULT 0,
    available INT NOT NULL DEFAULT 0,
    description NVARCHAR(MAX),
    coverImage NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (authorId) REFERENCES Authors(id),
    FOREIGN KEY (publisherId) REFERENCES Publishers(id),
    FOREIGN KEY (categoryId) REFERENCES Categories(id)
);
GO

-- Transactions Table
CREATE TABLE Transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    bookId INT NOT NULL,
    type NVARCHAR(20) NOT NULL CHECK (type IN ('borrow', 'return')),
    transactionDate DATETIME DEFAULT GETDATE(),
    dueDate DATETIME,
    returnDate DATETIME,
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookId) REFERENCES Books(id)
);
GO

-- Fines Table
CREATE TABLE Fines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    transactionId INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason NVARCHAR(255),
    status NVARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'waived')),
    paidDate DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (transactionId) REFERENCES Transactions(id)
);
GO

-- Reservations Table
CREATE TABLE Reservations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    bookId INT NOT NULL,
    reservationDate DATETIME DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
    expiryDate DATETIME,
    fulfilledDate DATETIME,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookId) REFERENCES Books(id)
);
GO

-- Reviews Table
CREATE TABLE Reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    bookId INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookId) REFERENCES Books(id)
);
GO

-- Book Requests Table (for 3rd book approval system)
CREATE TABLE BookRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    bookId INT NOT NULL,
    requestNote NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requestDate DATETIME DEFAULT GETDATE(),
    reviewedBy INT,
    reviewDate DATETIME,
    reviewNote NVARCHAR(500),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (bookId) REFERENCES Books(id),
    FOREIGN KEY (reviewedBy) REFERENCES Users(id)
);
GO

-- Book Audit Log Table
CREATE TABLE BookAuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bookId INT NOT NULL,
    oldQuantity INT,
    newQuantity INT,
    oldAvailable INT,
    newAvailable INT,
    actionType NVARCHAR(20),
    changedAt DATETIME DEFAULT GETDATE(),
    changedBy NVARCHAR(255)
);
GO

-- User Audit Log Table
CREATE TABLE UserAuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    actionType NVARCHAR(50),
    actionDescription NVARCHAR(500),
    actionDate DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- SQL VIEWS WITH JOINS
-- ============================================

-- View 1: Complete Book Details with JOIN
GO
CREATE OR ALTER VIEW vw_BookDetails AS
SELECT 
    b.id, b.title, b.isbn, b.publishYear, b.quantity, b.available,
    a.name AS authorName, a.country AS authorCountry,
    p.name AS publisherName,
    c.name AS categoryName,
    (b.quantity - b.available) AS borrowed,
    CAST(ROUND((CAST(b.available AS FLOAT) / NULLIF(b.quantity, 0)) * 100, 2) AS DECIMAL(5,2)) AS availabilityPercent
FROM Books b
INNER JOIN Authors a ON b.authorId = a.id
LEFT JOIN Publishers p ON b.publisherId = p.id
LEFT JOIN Categories c ON b.categoryId = c.id;
GO

-- View 2: Active Transactions with Details (with 2-day grace period)
GO
CREATE OR ALTER VIEW vw_TransactionDetails AS
SELECT 
    t.id, t.transactionDate, t.dueDate, t.returnDate, t.status,
    u.name AS userName, u.studentid, u.email,
    b.title AS bookTitle, a.name AS authorName, c.name AS category,
    DATEDIFF(day, GETDATE(), t.dueDate) AS daysRemaining,
    CASE 
        WHEN t.status = 'active' AND GETDATE() > t.dueDate THEN
            CASE 
                WHEN DATEDIFF(day, t.dueDate, GETDATE()) > 2 
                THEN (DATEDIFF(day, t.dueDate, GETDATE()) - 2) * 10 
                ELSE 0 
            END
        ELSE 0 
    END AS fineAmount
FROM Transactions t
INNER JOIN Users u ON t.userId = u.id
INNER JOIN Books b ON t.bookId = b.id
INNER JOIN Authors a ON b.authorId = a.id
LEFT JOIN Categories c ON b.categoryId = c.id;
GO

-- View 3: User Statistics
GO
CREATE OR ALTER VIEW vw_UserStats AS
SELECT 
    u.id, u.name, u.email, u.studentid, u.role,
    COUNT(DISTINCT t.id) AS totalBorrows,
    SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) AS activeBorrows,
    ISNULL(SUM(f.amount), 0) AS totalFines,
    SUM(CASE WHEN f.status = 'unpaid' THEN f.amount ELSE 0 END) AS unpaidFines
FROM Users u
LEFT JOIN Transactions t ON u.id = t.userId
LEFT JOIN Fines f ON u.id = f.userId
GROUP BY u.id, u.name, u.email, u.studentid, u.role;
GO

-- View 4: Book Popularity with Reviews
GO
CREATE OR ALTER VIEW vw_BookPopularity AS
SELECT 
    b.id, b.title, a.name AS authorName, c.name AS category,
    COUNT(DISTINCT t.id) AS borrowCount,
    COUNT(DISTINCT r.id) AS reviewCount,
    AVG(CAST(r.rating AS FLOAT)) AS avgRating,
    b.available, b.quantity
FROM Books b
INNER JOIN Authors a ON b.authorId = a.id
LEFT JOIN Categories c ON b.categoryId = c.id
LEFT JOIN Transactions t ON b.id = t.bookId
LEFT JOIN Reviews r ON b.id = r.bookId
GROUP BY b.id, b.title, a.name, c.name, b.available, b.quantity;
GO

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Borrow Book with Validations
GO
CREATE OR ALTER PROCEDURE sp_BorrowBookEnhanced
    @userId INT,
    @bookId INT,
    @daysToReturn INT = 14
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validations
        IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @userId)
            THROW 50001, 'User not found', 1;
            
        IF NOT EXISTS (SELECT 1 FROM Books WHERE id = @bookId)
            THROW 50002, 'Book not found', 1;
            
        DECLARE @available INT;
        SELECT @available = available FROM Books WHERE id = @bookId;
        IF @available <= 0
            THROW 50003, 'Book not available', 1;
            
        -- Check borrowing limit
        IF (SELECT COUNT(*) FROM Transactions WHERE userId = @userId AND status = 'active') >= 3
            THROW 50004, 'Borrowing limit reached', 1;
            
        -- Check unpaid fines
        IF EXISTS (SELECT 1 FROM Fines WHERE userId = @userId AND status = 'unpaid')
            THROW 50005, 'Clear unpaid fines first', 1;
        
        -- Create transaction
        DECLARE @dueDate DATETIME = DATEADD(day, @daysToReturn, GETDATE());
        INSERT INTO Transactions (userId, bookId, type, transactionDate, dueDate, status)
        VALUES (@userId, @bookId, 'borrow', GETDATE(), @dueDate, 'active');
        
        -- Update availability
        UPDATE Books SET available = available - 1 WHERE id = @bookId;
        
        COMMIT TRANSACTION;
        SELECT 'Success' AS result, SCOPE_IDENTITY() AS transactionId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: Admin Dashboard Statistics
GO
CREATE OR ALTER PROCEDURE sp_AdminDashboard
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Overall stats
    SELECT 
        (SELECT COUNT(*) FROM Books) AS totalBooks,
        (SELECT SUM(quantity) FROM Books) AS totalCopies,
        (SELECT COUNT(*) FROM Users WHERE role = 'student') AS totalStudents,
        (SELECT COUNT(*) FROM Transactions WHERE status = 'active') AS activeLoans,
        (SELECT COUNT(*) FROM vw_TransactionDetails WHERE fineAmount > 0) AS overdueBooks,
        (SELECT SUM(amount) FROM Fines WHERE status = 'unpaid') AS totalUnpaidFines;
    
    -- Top books
    SELECT TOP 5 * FROM vw_BookPopularity ORDER BY borrowCount DESC;
    
    -- Recent transactions
    SELECT TOP 10 * FROM vw_TransactionDetails ORDER BY transactionDate DESC;
END;
GO

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-create fine for overdue returns (with 2-day grace period)
GO
CREATE OR ALTER TRIGGER trg_CreateFineOnReturn
ON Transactions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Fines (userId, transactionId, amount, reason, status)
    SELECT 
        i.userId,
        i.id,
        CASE 
            WHEN DATEDIFF(day, i.dueDate, i.returnDate) > 2 
            THEN (DATEDIFF(day, i.dueDate, i.returnDate) - 2) * 10 
            ELSE 0 
        END,
        'Late return fine (2-day grace period)',
        'unpaid'
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.status = 'returned' 
      AND d.status = 'active'
      AND i.returnDate > i.dueDate
      AND DATEDIFF(day, i.dueDate, i.returnDate) > 2
      AND NOT EXISTS (SELECT 1 FROM Fines WHERE transactionId = i.id);
END;
GO

-- Trigger: Prevent deletion of books with active loans
GO
CREATE OR ALTER TRIGGER trg_PreventBookDelete
ON Books
INSTEAD OF DELETE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM deleted d 
               INNER JOIN Transactions t ON d.id = t.bookId 
               WHERE t.status = 'active')
    BEGIN
        RAISERROR('Cannot delete book with active loans', 16, 1);
        RETURN;
    END
    DELETE FROM Books WHERE id IN (SELECT id FROM deleted);
END;
GO

-- Trigger: Update book availability on transaction changes
GO
CREATE OR ALTER TRIGGER trg_UpdateBookAvailability
ON Transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle new borrows
    UPDATE b
    SET available = available - 1
    FROM Books b
    INNER JOIN inserted i ON b.id = i.bookId
    LEFT JOIN deleted d ON i.id = d.id
    WHERE i.type = 'borrow' 
      AND i.status = 'active'
      AND (d.id IS NULL OR d.status != 'active');
    
    -- Handle returns
    UPDATE b
    SET available = available + 1
    FROM Books b
    INNER JOIN inserted i ON b.id = i.bookId
    INNER JOIN deleted d ON i.id = d.id
    WHERE d.status = 'active' 
      AND i.status = 'returned';
END;
GO

-- ============================================
-- SEED DATA
-- ============================================

-- Insert sample authors
INSERT INTO Authors (name, biography, country) VALUES
    ('Thomas H. Cormen', 'Computer scientist and professor, co-author of Introduction to Algorithms', 'USA'),
    ('Robert C. Martin', 'Software engineer and author known as Uncle Bob', 'USA'),
    ('Abraham Silberschatz', 'Computer science professor specializing in database systems', 'USA'),
    ('Andrew Hunt', 'Programmer and author of The Pragmatic Programmer', 'USA'),
    ('Martin Fowler', 'Software developer and author on software architecture', 'UK'),
    ('Eric Evans', 'Software design consultant and author', 'USA'),
    ('Herbert Schildt', 'American computer science author', 'USA'),
    ('Bjarne Stroustrup', 'Creator of C++ programming language', 'Denmark'),
    ('Donald Knuth', 'Computer scientist and mathematician, author of TAOCP', 'USA'),
    ('Brian Kernighan', 'Computer scientist, co-author of The C Programming Language', 'Canada');
PRINT '✅ Authors inserted';
GO

-- Insert sample publishers
INSERT INTO Publishers (name, address, phone, email) VALUES
    ('MIT Press', '1 Rogers Street, Cambridge, MA 02142', '+1-617-253-5255', 'mitpress-info@mit.edu'),
    ('Prentice Hall', 'One Lake Street, Upper Saddle River, NJ 07458', '+1-201-236-7000', 'info@pearson.com'),
    ('O''Reilly Media', '1005 Gravenstein Highway North, Sebastopol, CA 95472', '+1-707-827-7000', 'info@oreilly.com'),
    ('Addison-Wesley', '75 Arlington Street, Boston, MA 02116', '+1-617-848-6000', 'info@awprofessional.com'),
    ('McGraw-Hill', '1221 Avenue of the Americas, New York, NY 10020', '+1-212-512-2000', 'customer.service@mheducation.com');
PRINT '✅ Publishers inserted';
GO

-- Insert sample categories
INSERT INTO Categories (name, description) VALUES
    ('Computer Science', 'Programming, algorithms, and computer theory'),
    ('Software Engineering', 'Software development practices and methodologies'),
    ('Database Systems', 'Database theory, design, and implementation'),
    ('Web Development', 'Frontend and backend web technologies'),
    ('Data Structures', 'Data organization and algorithm efficiency'),
    ('Operating Systems', 'OS design, implementation, and management'),
    ('Networking', 'Computer networks and communication protocols'),
    ('Artificial Intelligence', 'AI, machine learning, and neural networks'),
    ('Cybersecurity', 'Information security and ethical hacking'),
    ('Mobile Development', 'iOS, Android, and cross-platform development');
PRINT '✅ Categories inserted';
GO

-- Insert admin user (password: admin123)
INSERT INTO Users (name, email, password, studentid, role, phone, createdAt, v)
    VALUES (
        'Admin User', 
        'admin@bahria.edu.pk', 
        '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', 
        'ADMIN-001', 
        'admin', 
        '03001234567', 
        GETDATE(), 
        1
    );
PRINT '✅ Admin user inserted';
GO

-- Insert sample student users
INSERT INTO Users (name, email, password, studentid, role, phone) VALUES
    ('Ahmed Ali', 'ahmed.ali@bahria.edu.pk', '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', '01-111-191-001', 'student', '03001111001'),
    ('Fatima Khan', 'fatima.khan@bahria.edu.pk', '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', '01-111-191-002', 'student', '03001111002'),
    ('Hassan Raza', 'hassan.raza@bahria.edu.pk', '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', '01-111-191-003', 'student', '03001111003'),
    ('Ayesha Malik', 'ayesha.malik@bahria.edu.pk', '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', '01-111-191-004', 'student', '03001111004'),
    ('Usman Ahmed', 'usman.ahmed@bahria.edu.pk', '$2b$10$YlDrT8OGageKVz5icv19ZOLxr/eI.tkjduc4qXaKMEIgh0smj09qG', '01-111-191-005', 'student', '03001111005');
PRINT '✅ Student users inserted';
GO

-- Insert sample books
-- Get IDs for relationships
DECLARE @author1 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Cormen%');
DECLARE @author2 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Martin%');
DECLARE @author3 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Silberschatz%');
DECLARE @author4 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Hunt%');
DECLARE @author5 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Fowler%');
DECLARE @author6 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Evans%');
DECLARE @author7 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Schildt%');
DECLARE @author8 INT = (SELECT TOP 1 id FROM Authors WHERE name LIKE '%Stroustrup%');

DECLARE @pub1 INT = (SELECT TOP 1 id FROM Publishers WHERE name LIKE '%MIT%');
DECLARE @pub2 INT = (SELECT TOP 1 id FROM Publishers WHERE name LIKE '%Prentice%');
DECLARE @pub3 INT = (SELECT TOP 1 id FROM Publishers WHERE name LIKE '%O''Reilly%');
DECLARE @pub4 INT = (SELECT TOP 1 id FROM Publishers WHERE name LIKE '%Addison%');

DECLARE @cat1 INT = (SELECT id FROM Categories WHERE name = 'Computer Science');
DECLARE @cat2 INT = (SELECT id FROM Categories WHERE name = 'Software Engineering');
DECLARE @cat3 INT = (SELECT id FROM Categories WHERE name = 'Database Systems');
DECLARE @cat4 INT = (SELECT id FROM Categories WHERE name = 'Data Structures');
DECLARE @cat5 INT = (SELECT id FROM Categories WHERE name = 'Web Development');

INSERT INTO Books (title, authorId, publisherId, categoryId, isbn, publishYear, quantity, available, description) VALUES
    ('Introduction to Algorithms', @author1, @pub1, @cat4, '978-0262033848', 2009, 5, 5, 'Comprehensive textbook on algorithms and data structures'),
    ('Clean Code', @author2, @pub2, @cat2, '978-0132350884', 2008, 4, 3, 'A handbook of agile software craftsmanship'),
    ('Database System Concepts', @author3, @pub2, @cat3, '978-0073523323', 2010, 3, 2, 'Fundamental concepts of database systems'),
    ('The Pragmatic Programmer', @author4, @pub4, @cat2, '978-0201616224', 1999, 2, 2, 'Your journey to mastery in software development'),
    ('Refactoring', @author5, @pub4, @cat2, '978-0201485677', 1999, 3, 3, 'Improving the design of existing code'),
    ('Domain-Driven Design', @author6, @pub4, @cat2, '978-0321125217', 2003, 2, 1, 'Tackling complexity in the heart of software'),
    ('Java: The Complete Reference', @author7, @pub3, @cat1, '978-1260440232', 2018, 4, 4, 'Comprehensive guide to Java programming'),
    ('The C Programming Language', @author1, @pub2, @cat1, '978-0131103627', 1988, 3, 2, 'Classic text on C programming'),
    ('Design Patterns', @author5, @pub4, @cat2, '978-0201633610', 1994, 3, 2, 'Elements of reusable object-oriented software'),
    ('The Art of Computer Programming', @author1, @pub4, @cat4, '978-0201896831', 1997, 2, 2, 'Fundamental algorithms and analysis');
PRINT '✅ Books inserted';
GO

-- Insert sample transactions
DECLARE @user1 INT, @user2 INT, @book1 INT, @book2 INT;

SELECT @user1 = MIN(id), @user2 = MAX(id) 
FROM (SELECT TOP 2 id FROM Users WHERE role = 'student' ORDER BY id) AS Users;

SELECT @book1 = MIN(id), @book2 = MAX(id) 
FROM (SELECT TOP 2 id FROM Books ORDER BY id) AS Books;

-- Active transaction
INSERT INTO Transactions (userId, bookId, type, transactionDate, dueDate, status) VALUES
(@user1, @book1, 'borrow', DATEADD(day, -5, GETDATE()), DATEADD(day, 9, GETDATE()), 'active');

-- Overdue transaction
INSERT INTO Transactions (userId, bookId, type, transactionDate, dueDate, status) VALUES
(@user2, @book2, 'borrow', DATEADD(day, -20, GETDATE()), DATEADD(day, -6, GETDATE()), 'active');

-- Returned transaction
INSERT INTO Transactions (userId, bookId, type, transactionDate, dueDate, returnDate, status) VALUES
(@user1, @book2, 'borrow', DATEADD(day, -30, GETDATE()), DATEADD(day, -16, GETDATE()), DATEADD(day, -17, GETDATE()), 'returned');

PRINT '✅ Transactions inserted';
GO

-- Insert sample fines for overdue book
DECLARE @overdueUser INT = (SELECT TOP 1 userId FROM Transactions WHERE status = 'active' AND GETDATE() > dueDate);
DECLARE @overdueTrans INT = (SELECT TOP 1 id FROM Transactions WHERE status = 'active' AND GETDATE() > dueDate);

IF @overdueUser IS NOT NULL
BEGIN
    INSERT INTO Fines (userId, transactionId, amount, reason, status) VALUES
    (@overdueUser, @overdueTrans, 60, 'Late return fine - 6 days overdue', 'unpaid');
    PRINT '✅ Fines inserted';
END
GO

-- Insert sample reservations
DECLARE @resUser INT;
SELECT @resUser = id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM Users WHERE role = 'student') AS t WHERE rn = 3;
DECLARE @resBook INT = (SELECT TOP 1 id FROM Books WHERE available = 0);

IF @resBook IS NOT NULL
BEGIN
    INSERT INTO Reservations (userId, bookId, reservationDate, status, expiryDate) VALUES
    (@resUser, @resBook, GETDATE(), 'pending', DATEADD(day, 7, GETDATE()));
    PRINT '✅ Reservations inserted';
END
GO

-- Insert sample reviews
DECLARE @revUser1 INT, @revUser2 INT, @revBook1 INT, @revBook2 INT;

SELECT @revUser1 = MIN(id), @revUser2 = MAX(id) 
FROM (SELECT TOP 2 id FROM Users WHERE role = 'student' ORDER BY id) AS Users;

SELECT @revBook1 = MIN(id), @revBook2 = MAX(id) 
FROM (SELECT TOP 2 id FROM Books ORDER BY id) AS Books;

INSERT INTO Reviews (userId, bookId, rating, review) VALUES
(@revUser1, @revBook1, 5, 'Excellent book on algorithms! Very comprehensive and well-explained.'),
(@revUser2, @revBook2, 4, 'Great guide for writing clean code. Highly recommended for developers.'),
(@revUser1, @revBook2, 5, 'Changed my perspective on software development. Must read!');
PRINT '✅ Reviews inserted';
GO

PRINT '====================================';
PRINT '✅ Enhanced schema created successfully!';
PRINT '✅ All seed data inserted!';
PRINT '====================================';
GO

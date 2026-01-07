require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { poolPromise, sql } = require('./src/db'); // make sure db.js exports poolPromise

const app = express();

// =========================
// Database initialization
async function initializeDatabase() {
  try {
    const pool = await poolPromise;

    // Check if Users table exists
    const usersTableExists = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'Users'
    `);

    if (usersTableExists.recordset.length === 0) {
      console.log('Creating database tables...');

      // Create Users table
      await pool.request().query(`
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
        )
      `);

      // Create Books table
      await pool.request().query(`
        CREATE TABLE Books (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(255) NOT NULL,
          author NVARCHAR(255) NOT NULL,
          isbn NVARCHAR(50) UNIQUE,
          category NVARCHAR(100),
          quantity INT NOT NULL DEFAULT 0,
          available INT NOT NULL DEFAULT 0,
          description NVARCHAR(MAX),
          createdAt DATETIME DEFAULT GETDATE()
        )
      `);

      // Create Transactions table
      await pool.request().query(`
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
        )
      `);

      // Insert sample admin user (password: admin123)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.request()
        .input('name', sql.NVarChar, 'Admin User')
        .input('email', sql.NVarChar, 'admin@bahria.edu.pk')
        .input('password', sql.NVarChar, hashedPassword)
        .input('studentid', sql.NVarChar, 'ADMIN-001')
        .input('role', sql.NVarChar, 'admin')
        .input('phone', sql.NVarChar, '03001234567')
        .input('createdAt', sql.DateTime, new Date())
        .input('v', sql.Int, 1)
        .query(`INSERT INTO Users
                (name, email, password, studentid, role, phone, createdAt, v)
                VALUES (@name, @email, @password, @studentid, @role, @phone, @createdAt, @v)`);

      // Insert sample books
      const sampleBooks = [
        { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', quantity: 5, available: 5, description: 'Comprehensive textbook on algorithms' },
        { title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-0073523323', category: 'Computer Science', quantity: 3, available: 3, description: 'Fundamental concepts of database systems' },
        { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Software Engineering', quantity: 4, available: 4, description: 'A handbook of agile software craftsmanship' },
        { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0201616224', category: 'Software Engineering', quantity: 2, available: 2, description: 'Your journey to mastery' }
      ];

      for (const book of sampleBooks) {
        await pool.request()
          .input('title', sql.NVarChar, book.title)
          .input('author', sql.NVarChar, book.author)
          .input('isbn', sql.NVarChar, book.isbn)
          .input('category', sql.NVarChar, book.category)
          .input('quantity', sql.Int, book.quantity)
          .input('available', sql.Int, book.available)
          .input('description', sql.NVarChar, book.description)
          .query(`INSERT INTO Books (title, author, isbn, category, quantity, available, description)
                  VALUES (@title, @author, @isbn, @category, @quantity, @available, @description)`);
      }

      console.log('✅ Database tables created and sample data inserted');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

// =========================
// Middleware
app.use(cors());
app.use(express.json());

// =========================
// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/books', require('./src/routes/books'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/book-requests', require('./src/routes/bookRequests'));

// =========================
// Root route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Bahria LMS API is running with SQL Server!' });
});

// =========================
// Test DB connection route
app.get('/test-users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users'); // replace 'Users' if different
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ message: 'Database connection error', error: err.message });
  }
});

// =========================
// Start server
const PORT = process.env.PORT || 5000;

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

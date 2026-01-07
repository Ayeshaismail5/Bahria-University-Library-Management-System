const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

// ------------------------
// Admin: Get all transactions
// ------------------------
exports.getAllTransactions = async (req, res) => {
  try {
    let query = {};

    // 🟢 If user is a student, only show their transactions
    if (req.user.role === 'student') {
      query.userId = req.user._id;
    }

    const transactions = await Transaction.find(query)
      .populate('bookId', 'title author category')
      .populate('userId', 'name email studentId')
      .sort({ issueDate: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Admin: Issue book manually
// ------------------------
exports.issueBook = async (req, res) => {
  try {
    const { bookId, userId, dueDate } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies <= 0)
      return res.status(400).json({ message: 'No copies available' });

    const transaction = await Transaction.create({
      bookId,
      userId,
      dueDate,
      status: 'issued',
    });

    book.availableCopies -= 1;
    await book.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('bookId', 'title author category')
      .populate('userId', 'name email studentId');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ------------------------
// Admin: Return book
// ------------------------
exports.returnBook = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const today = new Date();
    const dueDate = new Date(transaction.dueDate);
    let fine = 0;

    // 💰 Fine calculation (10 Rs per day)
    if (today > dueDate) {
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 10;
    }

    transaction.returnDate = today;
    transaction.status = 'returned';
    transaction.fine = fine;
    await transaction.save();

    // Restore available copies
    const book = await Book.findById(transaction.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('bookId', 'title author category')
      .populate('userId', 'name email studentId');

    res.json(populatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------------
// Student: Borrow book (with 3-book limit)
// ------------------------
exports.createTransaction = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id; // from JWT

    // Step 1: Check borrow limit
    const activeBorrows = await Transaction.find({
      userId: userId,
      status: 'issued', // must match database status
    });

    if (activeBorrows.length >= 3) {
      return res.status(400).json({
        message:
          'You have reached the maximum borrow limit (3 books). Please return a book before borrowing another.',
      });
    }

    // Step 2: Validate book availability
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies <= 0)
      return res.status(400).json({ message: 'No available copies left' });

    // Step 3: Create new transaction
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 7); // 7 days due

    const transaction = await Transaction.create({
      bookId,
      userId,
      issueDate,
      dueDate,
      status: 'issued',
      fine: 0,
    });

    // Step 4: Update available copies
    book.availableCopies -= 1;
    await book.save();

    // Step 5: Populate data before sending
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('bookId', 'title author category')
      .populate('userId', 'name email studentId');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

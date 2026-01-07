-- Migration Script: Add BookRequests Table
-- Run this script to add the BookRequests table for the 3rd book approval system

-- Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BookRequests' AND xtype='U')
BEGIN
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
    PRINT 'BookRequests table created successfully';
END
ELSE
BEGIN
    PRINT 'BookRequests table already exists';
END
GO

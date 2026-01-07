📚 Bahria University Library Management System
A full-stack Library Management System developed as an academic project for Bahria University.
The system provides separate dashboards for Admin and Students to efficiently manage books, users, and library transactions.

🚀 Features
👩‍💼 Admin Dashboard
Secure admin authentication
Add, update, and delete books
Manage student members
Approve or reject book requests
Track issued and returned books
View library reports and statistics

🎓 Student Dashboard
Student login and authentication
Browse available books
Request and borrow books
View borrowing history
Update profile and change password

🛠️ Technology Stack
Frontend
React (Vite)
TypeScript
Tailwind CSS
Shadcn UI
Axios

Backend
Node.js
Express.js
SQL Database
JWT Authentication

📂 Project Structure
Bahria-University-Library-Management-System/
│
├── bahria-lms-backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── config/
│   ├── server.js
│   └── package.json
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── assets/
│
├── public/
├── package.json
├── .gitignore
└── README.md

⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/Ayeshaismail5/Bahria-University-Library-Management-System.git
cd Bahria-University-Library-Management-System

2️⃣ Frontend Setup
npm install
npm run dev

3️⃣ Backend Setup
cd bahria-lms-backend
npm install
node server.js

⚠️ Make sure your SQL database is running and properly configured.

🔐 Environment Variables
Create a .env file inside bahria-lms-backend:
env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=library_db
JWT_SECRET=your_secret_key

🎓 Academic Purpose
This project was developed for academic learning and demonstrates:
Full-stack web development
RESTful API design
SQL database design
Authentication & authorization
Role-based access control

👩‍💻 Author
Ayesha Ismail
Information Technology Student
Bahria University

🔗 GitHub: https://github.com/Ayeshaismail5

📜 License
This project is for educational purposes only.


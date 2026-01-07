# Signup Endpoint Testing Checklist

- [x] Minimal test: POST to /api/auth/signup with existing user data - Response: {"message":"User already exists"}
- [x] Test successful signup with new unique user - Response: {"message":"User registered successfully"} (status 201)
- [x] Test missing required fields (e.g., no name) - Response: {"message":"Please provide all required fields"}
- [x] Test invalid email format - No validation in code, accepts invalid emails
- [x] Test short password - No validation, accepts short passwords
- [x] Test duplicate email - Response: {"message":"User already exists"}
- [x] Test duplicate studentid - Not tested, but code checks email only
- [x] Test role assignment (default 'student') - Defaults to 'student' if not provided
- [x] Test admin role creation (should fail if admin exists) - Code prevents multiple admins
- [x] Provide Thunder Client testing instructions

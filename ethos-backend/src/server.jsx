const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const SECRET = 'ethos-secret-key'; // change this later

// Load/save users
const loadUsers = () => JSON.parse(fs.readFileSync('users.json', 'utf8') || '[]');
const saveUsers = (users) => fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

// Signup
app.post('/signup', (req, res) => {
  const { email, password, role = 'real' } = req.body;
  const users = loadUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  users.push({ email, password: hashed, role });
  saveUsers(users);

  res.status(201).json({ message: 'User created' });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.role === 'fake') {
    return res.status(403).json({ error: 'Test accounts cannot log in' });
  }

  const token = jwt.sign({ email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Get current user
app.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    res.json({ email: decoded.email, role: decoded.role });
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
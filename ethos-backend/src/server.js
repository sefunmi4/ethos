import express from 'express';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(express.json()); 

dotenv.config();
const SECRET = process.env.ACCESS_SECRET; // change this later
const USERS_FILE = './src/users.json'; 

const loadUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]'); // create file if missing
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('[USER FILE READ ERROR]', err);
    return [];
  }
};

const saveUsers = (users) =>
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[SIGNUP ATTEMPT]', email); // 👈 Add this

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser)
      return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[PASSWORD HASHED]'); // 👈

    const newUser = {
      email,
      password: hashedPassword,
      role: 'user'
    };

    users.push(newUser);
    saveUsers(users); // could crash here

    console.log('[USER SAVED]'); // 👈

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err); // 👈 will show the real issue
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
app.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('[Token Received]', token);
  try {
    const decoded = jwt.verify(token, SECRET); // ✅ must match login secret
    res.json({ email: decoded.email });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
import express from 'express';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // Make sure this is at the top of the file

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
    const { email, password, username } = req.body;
    console.log('[SIGNUP ATTEMPT]', email);

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser)
      return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[PASSWORD HASHED]');

    const newUser = {
      id: `u_${uuidv4()}`,
      username: username || email.split('@')[0], // fallback username
      email,
      password: hashedPassword,
      role: 'user',
      tags: ['explorer'], // default starting tag
      bio: '',
      links: {
        github: '',
        linkedin: '',
        tiktok: '',
        website: ''
      },
      experienceTimeline: [
        {
          datetime: new Date().toISOString(),
          title: 'Journey begins',
          tags: ['registered']
        }
      ]
    };

    users.push(newUser);
    saveUsers(users);

    console.log('[USER SAVED]', newUser.id);

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err);
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

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });

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
  try {
    const decoded = jwt.verify(token, SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { id, username, role, tags, bio, links } = user;
    res.json({ id, username, role, tags, bio, links });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.get('/api/users/:id/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const users = loadUsers();
    const user = users.find(u => u.id === req.params.id);

    // Ensure users can only access their own data
    if (!user || user.id !== decoded.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: user.id,
      username: user.username,
      bio: user.bio,
      tags: user.tags,
      links: user.links,
      experienceTimeline: user.experienceTimeline || [],
      projects: user.projects || [],
      privateData: {
        notes: user.notes || [],
        messages: user.messages || []
      }
    });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
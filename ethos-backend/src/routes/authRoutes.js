import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authMiddleware.js';
import { generateAccessToken, signRefreshToken } from '../utils/jwtUtils.js';
import { hashPassword, comparePasswords } from '../utils/passwordUtils.js';

dotenv.config();
const router = express.Router();

const USERS_FILE = './src/data/users.json';

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

/* ------------------------ REGISTER ------------------------ */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const users = loadUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser)
      return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: `u_${uuidv4()}`,
      username: username || email.split('@')[0],
      email,
      password: hashedPassword,
      role: 'user',
      tags: ['explorer'],
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

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/* ------------------------ LOGIN ------------------------ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await comparePasswords(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const refreshToken = signRefreshToken({ id: user.id, role: user.role });
    const accessToken = generateAccessToken({ id: user.id, role: user.role });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Login successful', accessToken });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------ ME ------------------------ */
router.get('/me', authenticate, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { id, username, role, tags, bio, links } = user;
  res.json({ id, username, role, tags, bio, links });
});

/* ------------------------ REFRESH ------------------------ */
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    res.json({ accessToken });
  });
});

/* ------------------------ LOGOUT ------------------------ */
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'Strict',
    secure: true
  });
  res.sendStatus(204);
});

export default router;
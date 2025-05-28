import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser'; // ✅ Ensure cookie support

import cookieAuth from '../middleware/cookieAuth.js';
import { generateAccessToken, signRefreshToken } from '../utils/jwtUtils.js';
import { hashPassword, comparePasswords } from '../utils/passwordUtils.js';

dotenv.config();
const router = express.Router();
router.use(cookieParser()); // ✅ Use cookie parser middleware

const USERS_FILE = './src/data/users.json';
const RESET_TOKENS_FILE = './src/data/resetTokens.json';

// ---------------------- Helper Utilities ----------------------

const loadUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

const loadResetTokens = () => JSON.parse(fs.readFileSync(RESET_TOKENS_FILE, 'utf8') || '{}');
const saveResetTokens = (data) => fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(data, null, 2));

const sendResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: 'no-reply@ethos.app',
    to: email,
    subject: 'Reset Your Password',
    text: `Reset your password using this link: ${resetUrl}`,
  };

  return transporter.sendMail(mailOptions);
};

// ---------------------- Auth Routes ----------------------

/** 🔐 Forgot Password */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = crypto.randomBytes(32).toString('hex');
  const tokens = loadResetTokens();
  tokens[token] = { id: user.id, expires: Date.now() + 15 * 60 * 1000 };
  saveResetTokens(tokens);

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  sendResetEmail(email, resetUrl)
    .then(() => res.status(200).json({ message: 'Password reset link sent' }))
    .catch((error) => {
      console.error('[EMAIL ERROR]', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    });
});

/** 🔁 Reset Password */
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const tokens = loadResetTokens();
  const tokenData = tokens[token];

  if (!tokenData || tokenData.expires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const users = loadUsers();
  const user = users.find(u => u.id === tokenData.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = await hashPassword(password);
  saveUsers(users);

  delete tokens[token];
  saveResetTokens(tokens);

  res.json({ message: 'Password updated successfully' });
});

/** 🧾 Register */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const newUser = {
      id: `u_${uuidv4()}`,
      username: username || email.split('@')[0],
      email,
      password: await hashPassword(password),
      role: 'user',
      tags: ['explorer'],
      bio: '',
      links: { github: '', linkedin: '', tiktok: '', website: '' },
      experienceTimeline: [{
        datetime: new Date().toISOString(),
        title: 'Journey begins',
        tags: ['registered']
      }]
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/** 🔑 Login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await comparePasswords(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const refreshToken = signRefreshToken({ id: user.id, role: user.role });
    const accessToken = generateAccessToken({ id: user.id, role: user.role });

    // ✅ Set secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax', // You may change to 'Lax' or 'None' depending on deployment
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: 'Login successful', accessToken });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** 👤 Me */
router.get('/me', cookieAuth, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { id, username, role, tags, bio, links, experienceTimeline } = user;
  res.json({ id, username, role, tags, bio, links, experienceTimeline });
});

/** 🔄 Refresh Token */
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    res.json({ accessToken });
  });
});

/** 🚪 Logout */
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
  });
  res.sendStatus(204);
});

export default router;
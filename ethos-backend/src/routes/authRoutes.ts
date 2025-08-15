import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';

import { JwtPayload } from 'jsonwebtoken';

import { cookieAuth } from '../middleware/cookieAuth';
import { generateAccessToken, signRefreshToken } from '../utils/jwtUtils';
import { hashPassword, comparePasswords } from '../utils/passwordUtils';
import type { User } from '../types/api';

import { asyncHandler } from '../utils/asyncHandler';
import { error } from '../utils/logger';
import { generateRandomUsername } from '../utils/usernameUtils';

import type { AuthenticatedRequest } from '../types/express';
import { pool } from '../db';




dotenv.config();

const router: Router = express.Router();
router.use(cookieParser());

const sendResetEmail = async (email: string, resetUrl: string) => {
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

// ---------------------- Routes ----------------------

router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      'INSERT INTO password_reset_tokens (token, user_id, expires) VALUES ($1, $2, $3)',
      [token, user.id, expires]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    try {
      await sendResetEmail(email, resetUrl);
      res.json({ message: 'Password reset link sent' });
    } catch (err) {
      error('[EMAIL ERROR]', err);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  })
);

router.post(
  '/reset-password/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    const { rows } = await pool.query(
      'SELECT user_id, expires FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    const data = rows[0];
    if (!data || new Date(data.expires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashed = await hashPassword(password);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashed,
      data.user_id,
    ]);
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [
      token,
    ]);

    res.json({ message: 'Password updated successfully' });
  })
);

router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password, username } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
        email,
      ]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      let newUsername = username || generateRandomUsername();
      // ensure unique username
      let check = await pool.query('SELECT id FROM users WHERE username = $1', [
        newUsername,
      ]);
      while (check.rows.length > 0) {
        newUsername = generateRandomUsername();
        check = await pool.query('SELECT id FROM users WHERE username = $1', [
          newUsername,
        ]);
      }

      const userId = uuidv4();
      const hashed = await hashPassword(password);
      await pool.query(
        'INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        [userId, newUsername, email, hashed, 'user']
      );
      res.status(201).json({ message: 'User registered', userId });
    } catch (err) {
      error('[REGISTER ERROR]', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  })
);

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);
      if (!result || result.rowCount === 0) {
        return res
          .status(401)
          .json({ error: 'Request empty or invalid credentials' });
      }
      const user: User | any = result.rows[0];

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res
          .status(401)
          .json({ error: 'Request empty or invalid credentials' });
      }

      const refreshToken = signRefreshToken({ id: user.id, role: user.role });
      const accessToken = generateAccessToken({ id: user.id, role: user.role });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ message: 'Login successful', accessToken });
    } catch (err) {
      error('[LOGIN ERROR]', err);
      res.status(500).json({ error: 'Internal error' });
    }
  })
);

router.get(
  '/me',
  cookieAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [
        req.user?.id,
      ]);
      const user = result.rows[0];
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const {
        id,
        email,
        username,
        role,
        tags,
        bio,
        links,
        experienceTimeline,
        xp,
      } = user;
      res.json({ id, email, username, role, tags, bio, links, experienceTimeline, xp });
    } catch (err) {
      error('[LOGIN ERROR]', err);
      res.status(500).json({ error: 'Internal error' });
    }
  }
);

router.patch(
  '/me',
  cookieAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
      if (fields.length === 0) {
        res.status(400).json({ error: 'No fields provided' });
        return;
      }
      const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      values.push(req.user?.id);
      const result = await pool.query(
        `UPDATE users SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
        values
      );
      res.json(result.rows[0]);
    } catch (err) {
      error('[UPDATE ME ERROR]', err);
      res.status(500).json({ error: 'Internal error' });
    }
  })
);

router.post(
  '/archive',
  cookieAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', [
        'archived',
        req.user?.id,
      ]);
      res.json({ success: true });
    } catch (err) {
      error('[ARCHIVE ERROR]', err);
      res.status(500).json({ error: 'Internal error' });
    }
  })
);

router.delete(
  '/me',
  cookieAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [req.user?.id]);
      res.json({ success: true });
    } catch (err) {
      error('[DELETE USER ERROR]', err);
      res.status(500).json({ error: 'Internal error' });
    }
  })
);
router.post('/refresh', (req: Request, res: Response): void => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(
    token,
    process.env.REFRESH_SECRET as string,
    (err: jwt.VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
      if (err || !decoded || typeof decoded === 'string') {
        res.sendStatus(403);
        return;
      }

      const accessToken = generateAccessToken({
        id: decoded.id,
        role: decoded.role,
      });

      res.json({ accessToken });
    }
  );
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Use the same SameSite setting as the login cookie so
    // the browser properly removes it on logout
    sameSite: 'lax',
  });
  res.sendStatus(204);
});

export default router;

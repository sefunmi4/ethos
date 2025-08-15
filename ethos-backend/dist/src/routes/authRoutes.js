"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cookieAuth_1 = require("../middleware/cookieAuth");
const jwtUtils_1 = require("../utils/jwtUtils");
const passwordUtils_1 = require("../utils/passwordUtils");
const asyncHandler_1 = require("../utils/asyncHandler");
const logger_1 = require("../utils/logger");
const usernameUtils_1 = require("../utils/usernameUtils");
const db_1 = require("../db");
dotenv_1.default.config();
const router = express_1.default.Router();
router.use((0, cookie_parser_1.default)());
const sendResetEmail = async (email, resetUrl) => {
    const transporter = nodemailer_1.default.createTransport({
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
router.post('/forgot-password', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: 'Email is required' });
    const { rows } = await db_1.pool.query('SELECT id FROM users WHERE email = $1', [
        email,
    ]);
    const user = rows[0];
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await db_1.pool.query('INSERT INTO password_reset_tokens (token, user_id, expires) VALUES ($1, $2, $3)', [token, user.id, expires]);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    try {
        await sendResetEmail(email, resetUrl);
        res.json({ message: 'Password reset link sent' });
    }
    catch (err) {
        (0, logger_1.error)('[EMAIL ERROR]', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
}));
router.post('/reset-password/:token', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const { rows } = await db_1.pool.query('SELECT user_id, expires FROM password_reset_tokens WHERE token = $1', [token]);
    const data = rows[0];
    if (!data || new Date(data.expires) < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashed = await (0, passwordUtils_1.hashPassword)(password);
    await db_1.pool.query('UPDATE users SET password = $1 WHERE id = $2', [
        hashed,
        data.user_id,
    ]);
    await db_1.pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [
        token,
    ]);
    res.json({ message: 'Password updated successfully' });
}));
router.post('/register', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const existing = await db_1.pool.query('SELECT id FROM users WHERE email = $1', [
            email,
        ]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        let newUsername = username || (0, usernameUtils_1.generateRandomUsername)();
        // ensure unique username
        let check = await db_1.pool.query('SELECT id FROM users WHERE username = $1', [
            newUsername,
        ]);
        while (check.rows.length > 0) {
            newUsername = (0, usernameUtils_1.generateRandomUsername)();
            check = await db_1.pool.query('SELECT id FROM users WHERE username = $1', [
                newUsername,
            ]);
        }
        const userId = (0, uuid_1.v4)();
        const hashed = await (0, passwordUtils_1.hashPassword)(password);
        await db_1.pool.query('INSERT INTO users (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)', [userId, newUsername, email, hashed, 'user']);
        res.status(201).json({ message: 'User registered', userId });
    }
    catch (err) {
        (0, logger_1.error)('[REGISTER ERROR]', err);
        res.status(500).json({ error: 'Registration failed' });
    }
}));
router.post('/login', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db_1.pool.query('SELECT * FROM users WHERE email = $1', [
            email,
        ]);
        if (!result || result.rowCount === 0) {
            return res
                .status(401)
                .json({ error: 'Request empty or invalid credentials' });
        }
        const user = result.rows[0];
        const valid = await (0, passwordUtils_1.comparePasswords)(password, user.password);
        if (!valid) {
            return res
                .status(401)
                .json({ error: 'Request empty or invalid credentials' });
        }
        const refreshToken = (0, jwtUtils_1.signRefreshToken)({ id: user.id, role: user.role });
        const accessToken = (0, jwtUtils_1.generateAccessToken)({ id: user.id, role: user.role });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ message: 'Login successful', accessToken });
    }
    catch (err) {
        (0, logger_1.error)('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Internal error' });
    }
}));
router.get('/me', cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM users WHERE id = $1', [
            req.user?.id,
        ]);
        const user = result.rows[0];
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { id, email, username, role, tags, bio, links, experienceTimeline, xp, } = user;
        res.json({ id, email, username, role, tags, bio, links, experienceTimeline, xp });
    }
    catch (err) {
        (0, logger_1.error)('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Internal error' });
    }
});
router.patch('/me', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        if (fields.length === 0) {
            res.status(400).json({ error: 'No fields provided' });
            return;
        }
        const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        values.push(req.user?.id);
        const result = await db_1.pool.query(`UPDATE users SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`, values);
        res.json(result.rows[0]);
    }
    catch (err) {
        (0, logger_1.error)('[UPDATE ME ERROR]', err);
        res.status(500).json({ error: 'Internal error' });
    }
}));
router.post('/archive', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        await db_1.pool.query('UPDATE users SET status = $1 WHERE id = $2', [
            'archived',
            req.user?.id,
        ]);
        res.json({ success: true });
    }
    catch (err) {
        (0, logger_1.error)('[ARCHIVE ERROR]', err);
        res.status(500).json({ error: 'Internal error' });
    }
}));
router.delete('/me', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        await db_1.pool.query('DELETE FROM users WHERE id = $1', [req.user?.id]);
        res.json({ success: true });
    }
    catch (err) {
        (0, logger_1.error)('[DELETE USER ERROR]', err);
        res.status(500).json({ error: 'Internal error' });
    }
}));
router.post('/refresh', (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.REFRESH_SECRET, (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
            res.sendStatus(403);
            return;
        }
        const accessToken = (0, jwtUtils_1.generateAccessToken)({
            id: decoded.id,
            role: decoded.role,
        });
        res.json({ accessToken });
    });
});
router.post('/logout', (_req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // Use the same SameSite setting as the login cookie so
        // the browser properly removes it on logout
        sameSite: 'lax',
    });
    res.sendStatus(204);
});
exports.default = router;

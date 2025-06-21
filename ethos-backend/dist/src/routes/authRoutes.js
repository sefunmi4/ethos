"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
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
dotenv_1.default.config();
const router = express_1.default.Router();
router.use((0, cookie_parser_1.default)());
const USERS_FILE = './src/data/users.json';
const RESET_TOKENS_FILE = './src/data/resetTokens.json';
// ---------------------- Utility Functions ----------------------
const loadUsers = () => JSON.parse(fs_1.default.readFileSync(USERS_FILE, 'utf8') || '[]');
const saveUsers = (users) => fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const loadResetTokens = () => JSON.parse(fs_1.default.readFileSync(RESET_TOKENS_FILE, 'utf8') || '{}');
const saveResetTokens = (data) => fs_1.default.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(data, null, 2));
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
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const tokens = loadResetTokens();
    tokens[token] = {
        id: user.id,
        expires: Date.now() + 15 * 60 * 1000,
    };
    saveResetTokens(tokens);
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
    const tokens = loadResetTokens();
    const tokenData = tokens[token];
    if (!tokenData || tokenData.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const users = loadUsers();
    const user = users.find(u => u.id === tokenData.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    user.password = await (0, passwordUtils_1.hashPassword)(password);
    saveUsers(users);
    delete tokens[token];
    saveResetTokens(tokens);
    res.json({ message: 'Password updated successfully' });
}));
router.post('/register', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const users = loadUsers();
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        let newUsername = username || (0, usernameUtils_1.generateRandomUsername)();
        while (users.find(u => u.username === newUsername)) {
            newUsername = (0, usernameUtils_1.generateRandomUsername)();
        }
        const newUser = {
            id: `u_${(0, uuid_1.v4)()}`,
            username: newUsername,
            email,
            password: await (0, passwordUtils_1.hashPassword)(password),
            role: 'user',
            tags: ['explorer'],
            bio: '',
            links: { github: '', linkedin: '', tiktok: '', website: '' },
            experienceTimeline: [
                {
                    datetime: new Date().toISOString(),
                    title: 'Journey begins',
                    tags: ['registered'],
                },
            ],
        };
        users.push(newUser);
        saveUsers(users);
        res.status(201).json({ message: 'User registered', userId: newUser.id });
    }
    catch (err) {
        (0, logger_1.error)('[REGISTER ERROR]', err);
        res.status(500).json({ error: 'Registration failed' });
    }
}));
router.post('/login', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = loadUsers();
        const user = users.find(u => u.email === email);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const valid = await (0, passwordUtils_1.comparePasswords)(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid password' });
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
router.get('/me', cookieAuth_1.cookieAuth, (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.user?.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const { id, email, username, role, tags, bio, links, experienceTimeline } = user;
    res.json({ id, email, username, role, tags, bio, links, experienceTimeline });
});
router.patch('/me', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.user?.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    Object.assign(user, req.body); // validate if needed
    saveUsers(users);
    res.json(user);
}));
router.post('/archive', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.id === req.user?.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    user.status = 'archived';
    saveUsers(users);
    res.json({ success: true });
}));
router.delete('/me', cookieAuth_1.cookieAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    let users = loadUsers();
    users = users.filter(u => u.id !== req.user?.id);
    saveUsers(users);
    res.json({ success: true });
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
        sameSite: 'strict',
    });
    res.sendStatus(204);
});
exports.default = router;

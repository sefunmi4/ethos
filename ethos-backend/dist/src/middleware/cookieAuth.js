"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
const cookieAuth = (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.status(403).json({ error: 'No token found in cookies' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.REFRESH_SECRET);
        req.user = decoded; // Extend `req` to include `user`
        return next(); // ✅ properly ends function with void return
    }
    catch (err) {
        (0, logger_1.error)('[COOKIE AUTH ERROR]', err);
        res.status(403).json({ error: 'Invalid or expired token' });
        return; // ✅ ensures return type is void
    }
};
exports.cookieAuth = cookieAuth;

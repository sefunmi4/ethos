"use strict";
// middleware/authOptional.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.ACCESS_SECRET || 'your-secret';
const authOptional = (req, res, next) => {
    let token = null;
    // Prefer cookie if available
    if (req.cookies?.refreshToken) {
        token = req.cookies.refreshToken;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, SECRET);
            req.user = decoded;
        }
        catch {
            req.user = null; // invalid token
        }
    }
    else {
        req.user = null; // no token
    }
    next();
};
exports.default = authOptional;

"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const gitRoutes_1 = __importDefault(require("./routes/gitRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const questRoutes_1 = __importDefault(require("./routes/questRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const boardRoutes_1 = __importDefault(require("./routes/boardRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
// Load environment variables from `.env` file
dotenv_1.default.config();
/**
 * Initialize the Express app.
 */
const app = (0, express_1.default)();
/**
 * Define allowed frontend origin.
 * @constant
 * @default 'http://localhost:5173'
 */
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
/**
 * Comma separated list of allowed origins for CORS.
 * Allows multiple frontends in different environments.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [CLIENT_URL]).map((o) => o.trim());
/**
 * Middleware setup
 * @middleware CORS - enable cross-origin resource sharing
 * @middleware express.json - parse incoming JSON payloads
 * @middleware cookieParser - parse cookie headers
 * @middleware helmet - basic security headers
 * @middleware rateLimit - basic rate limiting
 */
// Default set of allowed origins for CORS
const allowedOrigins = ALLOWED_ORIGINS;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' &&
        req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});
app.use((0, helmet_1.default)());
// Apply rate limiting only in production to prevent local development issues
if (process.env.NODE_ENV === 'production') {
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
    }));
}
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(logger_1.requestLogger);
/**
 * API Routes
 * All routes are mounted under /api/namespace
 */
app.use('/api/auth', authRoutes_1.default); // 🔐 Authentication (login, register, session)
app.use('/api/git', gitRoutes_1.default); // 🔁 Git sync, commits, diffs
app.use('/api/posts', postRoutes_1.default); // 📝 Posts, reactions, replies
app.use('/api/quests', questRoutes_1.default); // 📦 Quests, task maps
app.use('/api/projects', projectRoutes_1.default); // 🗂 Projects
app.use('/api/boards', boardRoutes_1.default); // 🧭 Boards and view layouts
app.use('/api/reviews', reviewRoutes_1.default); // ⭐ Reviews
app.use('/api/users', userRoutes_1.default); // 👥 Public user profiles
app.use('/api/notifications', notificationRoutes_1.default); // 🔔 User notifications
app.use('/api/health', healthRoutes_1.default); // ❤️ Health check
// Generic error handler to prevent leaking stack traces in production
app.use((err, _req, res, _next) => {
    console.error(err);
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal Server Error' });
    }
    else {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});
/**
 * Default server port
 * @default 4173
 */
const PORT = parseInt(process.env.PORT || '4173', 10);
/**
 * Start the server
 * @function listen
 * Logs a message with the active port and frontend origin
 */
app.listen(PORT, () => {
    (0, logger_1.info)(`🚀 Backend server running at http://18.118.173.176:${PORT}`);
    (0, logger_1.info)(`🌐 Accepting requests from: ${ALLOWED_ORIGINS.join(', ')}`);
});

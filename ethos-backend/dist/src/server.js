"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const logger_1 = require("./utils/logger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const gitRoutes_1 = __importDefault(require("./routes/gitRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const questRoutes_1 = __importDefault(require("./routes/questRoutes"));
const boardRoutes_1 = __importDefault(require("./routes/boardRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
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
 * CORS configuration.
 * Enables cookies and cross-origin support for the client.
 */
const corsOptions = {
    origin: CLIENT_URL,
    credentials: true,
};
/**
 * Middleware setup
 * @middleware cors - enable cross-origin resource sharing
 * @middleware express.json - parse incoming JSON payloads
 * @middleware cookieParser - parse cookie headers
 */
app.use((0, cors_1.default)(corsOptions));
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
app.use('/api/boards', boardRoutes_1.default); // 🧭 Boards and view layouts
app.use('/api/reviews', reviewRoutes_1.default); // ⭐ Reviews
app.use('/api/users', userRoutes_1.default); // 👥 Public user profiles
/**
 * Default server port
 * @default 3001
 */
const PORT = parseInt(process.env.PORT || '3001', 10);
/**
 * Start the server
 * @function listen
 * Logs a message with the active port and frontend origin
 */
app.listen(PORT, () => {
    (0, logger_1.info)(`🚀 Backend server running at http://localhost:${PORT}`);
    (0, logger_1.info)(`🌐 Accepting requests from: ${CLIENT_URL}`);
});

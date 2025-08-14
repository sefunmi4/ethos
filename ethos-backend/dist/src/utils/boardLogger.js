"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logBoardAction = logBoardAction;
const uuid_1 = require("uuid");
const db_1 = require("../db");
function logBoardAction(boardId, action, userId) {
    if (!db_1.usePg)
        return;
    db_1.pool
        .query('INSERT INTO board_logs (id, boardId, action, userId, timestamp) VALUES ($1,$2,$3,$4,NOW())', [(0, uuid_1.v4)(), boardId, action, userId])
        .catch((err) => console.error('Failed to log board action', err));
}

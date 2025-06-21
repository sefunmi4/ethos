"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logBoardAction = logBoardAction;
const uuid_1 = require("uuid");
const stores_1 = require("../models/stores");
function logBoardAction(boardId, action, userId) {
    const logs = stores_1.boardLogsStore.read();
    logs.push({ id: (0, uuid_1.v4)(), boardId, action, userId, timestamp: new Date().toISOString() });
    stores_1.boardLogsStore.write(logs);
}

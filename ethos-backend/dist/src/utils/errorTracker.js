"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logQuest404 = logQuest404;
const loaders_1 = require("./loaders");
const quest404Store = (0, loaders_1.createDataStore)('quest404.json', []);
function logQuest404(questId, path) {
    const logs = quest404Store.read();
    const existing = logs.find((l) => l.questId === questId && l.path === path);
    const now = new Date().toISOString();
    if (existing) {
        existing.count += 1;
        existing.lastOccurred = now;
    }
    else {
        logs.push({ questId, path, count: 1, lastOccurred: now });
    }
    quest404Store.write(logs);
}

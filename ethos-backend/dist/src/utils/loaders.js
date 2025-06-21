"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataStore = createDataStore;
// utils/loaders.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function createDataStore(filename, defaultData) {
    const filepath = path_1.default.join(__dirname, '../data', filename);
    const ensureFile = () => {
        if (!fs_1.default.existsSync(filepath) || fs_1.default.readFileSync(filepath, 'utf-8').trim() === '') {
            fs_1.default.writeFileSync(filepath, '[]');
        }
    };
    return {
        read: () => {
            try {
                if (!fs_1.default.existsSync(filepath)) {
                    fs_1.default.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
                    return defaultData;
                }
                const contents = fs_1.default.readFileSync(filepath, 'utf-8');
                if (!contents.trim()) {
                    fs_1.default.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
                    return defaultData;
                }
                return JSON.parse(contents);
            }
            catch {
                return defaultData;
            }
        },
        write: (data) => fs_1.default.writeFileSync(filepath, JSON.stringify(data, null, 2)),
        filepath,
    };
}

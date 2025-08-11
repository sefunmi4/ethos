"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usernameUtils_1 = require("../src/utils/usernameUtils");
describe('generateRandomUsername', () => {
    it('returns a string with pattern adjective_noun_number', () => {
        const name = (0, usernameUtils_1.generateRandomUsername)();
        expect(name).toMatch(/^[a-z]+_[a-z]+_\d{4}$/);
    });
    it('generates unique values on successive calls', () => {
        const first = (0, usernameUtils_1.generateRandomUsername)();
        const second = (0, usernameUtils_1.generateRandomUsername)();
        expect(first).not.toBe(second);
    });
});

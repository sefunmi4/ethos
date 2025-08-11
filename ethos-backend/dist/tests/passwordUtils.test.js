"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passwordUtils_1 = require("../src/utils/passwordUtils");
describe('password utils', () => {
    it('hashes and compares correctly', async () => {
        const password = 'mySecret123';
        const hash = await (0, passwordUtils_1.hashPassword)(password);
        expect(await (0, passwordUtils_1.comparePasswords)(password, hash)).toBe(true);
        expect(await (0, passwordUtils_1.comparePasswords)('wrongPassword', hash)).toBe(false);
    });
});

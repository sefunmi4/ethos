"use strict";
// src/utils/passwordUtils.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePasswords = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Hash a plaintext password using bcrypt
 * @param password - Plain text password
 * @returns A promise that resolves to the hashed password
 */
const hashPassword = (password) => {
    return bcryptjs_1.default.hash(password, 10);
};
exports.hashPassword = hashPassword;
/**
 * Compare a plaintext password to a stored hash
 * @param input - Plain text password entered by user
 * @param hash - Hashed password from the database
 * @returns A promise that resolves to a boolean indicating if the passwords match
 */
const comparePasswords = (input, hash) => {
    return bcryptjs_1.default.compare(input, hash);
};
exports.comparePasswords = comparePasswords;

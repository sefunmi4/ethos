"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomUsername = exports.nouns = exports.adjectives = void 0;
exports.adjectives = [
    'brave',
    'curious',
    'mighty',
    'noble',
    'swift',
    'cunning',
    'wise',
    'eager',
    'wild',
];
exports.nouns = [
    'lion',
    'dragon',
    'falcon',
    'tiger',
    'phoenix',
    'wizard',
    'ranger',
    'druid',
];
const generateRandomUsername = () => {
    const adj = exports.adjectives[Math.floor(Math.random() * exports.adjectives.length)];
    const noun = exports.nouns[Math.floor(Math.random() * exports.nouns.length)];
    const number = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
    return `${adj}_${noun}_${number}`;
};
exports.generateRandomUsername = generateRandomUsername;

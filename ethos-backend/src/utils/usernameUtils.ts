export const adjectives = [
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

export const nouns = [
  'lion',
  'dragon',
  'falcon',
  'tiger',
  'phoenix',
  'wizard',
  'ranger',
  'druid',
];

export const generateRandomUsername = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
  return `${adj}_${noun}_${number}`;
};

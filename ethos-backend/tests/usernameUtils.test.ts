import { generateRandomUsername } from '../src/utils/usernameUtils';

describe('generateRandomUsername', () => {
  it('returns a string with pattern adjective_noun_number', () => {
    const name = generateRandomUsername();
    expect(name).toMatch(/^[a-z]+_[a-z]+_\d{4}$/);
  });

  it('generates unique values on successive calls', () => {
    const first = generateRandomUsername();
    const second = generateRandomUsername();
    expect(first).not.toBe(second);
  });
});

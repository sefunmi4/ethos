import { hashPassword, comparePasswords } from '../src/utils/passwordUtils';

describe('password utils', () => {
  it('hashes and compares correctly', async () => {
    const password = 'mySecret123';
    const hash = await hashPassword(password);
    expect(await comparePasswords(password, hash)).toBe(true);
    expect(await comparePasswords('wrongPassword', hash)).toBe(false);
  });
});

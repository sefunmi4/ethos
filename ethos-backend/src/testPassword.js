
import bcrypt from 'bcryptjs';

// Replace with the password you're testing and the hashed value from users.json
const testPassword = 'password1';
const hashed = '$2b$10$VXj4shc3WsvD5ty0rbBMoumvCCMD0qIkqJ8g6CIUh3OVGFnkxlakG';

bcrypt.compare(testPassword, hashed).then(result => {
  console.log('Match?', result);
});
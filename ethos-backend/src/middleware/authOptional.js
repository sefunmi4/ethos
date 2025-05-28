// middleware/authOptional.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret';

const authOptional = (req, res, next) => {
  let token = null;

  // Prefer cookie if available
  if (req.cookies?.refreshToken) {
    token = req.cookies.refreshToken;
  }
  // Fallback to Authorization header
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
    } catch {
      req.user = null; // invalid token
    }
  } else {
    req.user = null; // no token
  }

  next();
};

export default authOptional;
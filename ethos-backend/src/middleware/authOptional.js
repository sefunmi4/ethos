// middleware/authOptional.js
import jwt from 'jsonwebtoken';

const authOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
      req.user = decoded;
    } catch {
      req.user = null; // invalid token, treat as anonymous
    }
  } else {
    req.user = null; // no token, anonymous user
  }
  next();
};

export default authOptional;
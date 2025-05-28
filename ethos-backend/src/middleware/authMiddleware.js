// middleware/authenticate.js
import jwt from 'jsonwebtoken';

export default function authenticate(req, res, next) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(403).json({ error: 'Missing or invalid token (cookie)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET); // ✅ match to cookie token
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
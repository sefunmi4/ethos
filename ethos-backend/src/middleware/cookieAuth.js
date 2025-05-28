import jwt from 'jsonwebtoken';

const cookieAuth = (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(403).json({ error: 'No token found in cookies' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET); // ✅ use REFRESH_SECRET
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[COOKIE AUTH ERROR]', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export default cookieAuth;
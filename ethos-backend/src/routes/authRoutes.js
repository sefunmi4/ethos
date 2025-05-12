// routes/authRoutes.js
res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
res.json({ accessToken });

app.post('/api/refresh', (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    });
});

res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'Strict', secure: true });
res.sendStatus(204);
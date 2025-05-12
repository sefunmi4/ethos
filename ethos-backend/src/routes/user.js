const { authenticate } = require('../middleware/authMiddleware');

router.get('/me', authenticate, (req, res) => {
  const { id, name, role, avatarUrl } = req.user;
  res.json({ id, name, role, avatarUrl });
});

router.get('/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});
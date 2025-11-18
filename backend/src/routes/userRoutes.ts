import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// Get user profile
router.get('/profile', async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// Update user profile
router.put('/profile', async (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
});

// Get user settings
router.get('/settings', async (req, res) => {
  res.json({ success: true, data: { settings: {} } });
});

// Update user settings
router.put('/settings', async (req, res) => {
  res.json({ success: true, message: 'Settings updated' });
});

export default router;

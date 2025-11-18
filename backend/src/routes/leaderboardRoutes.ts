import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// Get global leaderboard
router.get('/global', async (req, res) => {
  res.json({ success: true, data: { leaderboard: [] } });
});

// Get topic leaderboard
router.get('/topic/:topicId', async (req, res) => {
  res.json({ success: true, data: { topicId: req.params.topicId, leaderboard: [] } });
});

export default router;

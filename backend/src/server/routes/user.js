import { Router } from 'express';
import logger from '../logger.js';
import { listItineraries, listSavedPlaces, savePlace, deletePlace, getProfileStats, getSettings, updateSettings } from '../../services/user.js';

const router = Router();

router.get('/itineraries', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const list = await listItineraries(userId);
    res.json(list);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to list itineraries' });
  }
});

router.get('/places', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const list = await listSavedPlaces(userId);
    res.json(list);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to list places' });
  }
});

router.post('/places', async (req, res) => {
  try {
    const userId = req.body.userId || null;
    const place = await savePlace(userId, req.body);
    res.json(place);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to save place' });
  }
});

router.delete('/places/:id', async (req, res) => {
  try {
    const ok = await deletePlace(Number(req.params.id));
    res.json({ ok });
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to delete place' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const stats = await getProfileStats(userId);
    res.json(stats);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const settings = await getSettings(userId);
    res.json(settings);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const userId = req.body.userId || null;
    const settings = await updateSettings(userId, req.body);
    res.json(settings);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

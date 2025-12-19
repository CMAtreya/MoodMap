import { Router } from 'express';
import { z } from 'zod';
import logger from '../logger.js';
import { startTrip, getTripState, advanceTrip, reportCrowd, completeTrip } from '../../services/trips.js';

const router = Router();

const StartSchema = z.object({
  itineraryId: z.string(),
  userId: z.string().optional().nullable()
});

router.post('/start', async (req, res) => {
  const parse = StartSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  try {
    const trip = await startTrip(parse.data.itineraryId, parse.data.userId || null);
    res.json(trip);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

router.get('/:id/state', async (req, res) => {
  try {
    const state = await getTripState(req.params.id);
    if (!state) return res.status(404).json({ error: 'Not found' });
    res.json(state);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

const AdvanceSchema = z.object({
  action: z.enum(['checkout', 'add30', 'skip', 'pause', 'resume', 'end'])
});

router.post('/:id/advance', async (req, res) => {
  const parse = AdvanceSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  try {
    const state = await advanceTrip(req.params.id, parse.data.action);
    res.json(state);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

const CrowdSchema = z.object({
  stopOrder: z.number(),
  level: z.enum(['Low', 'Medium', 'High']),
  userId: z.string().optional()
});

router.post('/:id/report-crowd', async (req, res) => {
  const parse = CrowdSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  try {
    const ok = await reportCrowd(req.params.id, parse.data.stopOrder, parse.data.level, parse.data.userId || null);
    res.json({ ok });
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to report crowd' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const done = await completeTrip(req.params.id, req.body || {});
    res.json(done);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import logger from '../logger.js';
import { generateItinerary } from '../../services/itinerary.js';
import { saveItinerary, getItineraryById } from '../../services/persistence.js';

const router = Router();

const GenerateSchema = z.object({
  mood: z.enum([
    'Curious',
    'Adventurous',
    'Relaxed',
    'Romantic',
    'Energetic',
    'Social',
    'Family Fun'
  ]),
  timeWindowHours: z.number().min(1).max(12),
  start: z.object({
    lat: z.number(),
    lng: z.number(),
    timestamp: z.number()
  }),
  preferences: z.object({
    cuisines: z.array(z.string()).optional(),
    dietary: z.string().optional(),
    heritageVibe: z.boolean().optional()
  }).optional(),
  userId: z.string().optional()
});

router.post('/generate', async (req, res) => {
  const parse = GenerateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parse.error.flatten() });
  }
  try {
    const itinerary = await generateItinerary(parse.data);
    const saved = await saveItinerary(itinerary, parse.data.userId || null);
    res.json(saved);
  } catch (e) {
    logger.error(e.message);
    const input = parse.data;
    const fallback = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      mood: input.mood,
      timeWindowHours: input.timeWindowHours,
      start: input.start,
      narrative: `A ${input.mood.toLowerCase()} journey with 3 stops.`,
      tips: ['Wear comfy shoes'],
      stops: [
        { order: 1, placeId: 'start-walk', name: 'Scenic Walk', lat: input.start.lat + 0.003, lng: input.start.lng + 0.003, category: 'Outdoor', rating: null, reviews: null, arrivalTime: '10:00', departureTime: '11:00', durationMinutes: 60, travelMinutes: 0, crowdLevel: 'Low' },
        { order: 2, placeId: 'coffee-break', name: 'Coffee Break', lat: input.start.lat - 0.002, lng: input.start.lng - 0.001, category: 'Cafe', rating: null, reviews: null, arrivalTime: '11:20', departureTime: '12:05', durationMinutes: 45, travelMinutes: 20, crowdLevel: 'Medium' },
        { order: 3, placeId: 'viewpoint', name: 'City Viewpoint', lat: input.start.lat + 0.001, lng: input.start.lng - 0.003, category: 'Scenic', rating: null, reviews: null, arrivalTime: '12:30', departureTime: '13:15', durationMinutes: 45, travelMinutes: 25, crowdLevel: 'High' }
      ],
      summary: { totalDurationMinutes: 170, totalDistanceKm: 4.5, stopCount: 3 }
    };
    res.json(fallback);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const it = await getItineraryById(req.params.id);
    if (!it) return res.status(404).json({ error: 'Not found' });
    res.json(it);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const itinerary = req.body;
    if (itinerary.id !== req.params.id) {
      return res.status(400).json({ error: 'ID mismatch' });
    }
    // We assume the payload is a valid itinerary object. 
    // In a real app, we should validate it with Zod.
    const saved = await saveItinerary(itinerary, itinerary.userId || null); // userId might need to be passed explicitly if not in body
    res.json(saved);
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({ error: 'Failed to update itinerary' });
  }
});

export default router;

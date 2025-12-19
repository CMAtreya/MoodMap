import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './logger.js';
import itineraryRouter from './routes/itinerary.js';
import tripRouter from './routes/trip.js';
import userRouter from './routes/user.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.use('/api/itinerary', itineraryRouter);
app.use('/api/trip', tripRouter);
app.use('/api/user', userRouter);

app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;

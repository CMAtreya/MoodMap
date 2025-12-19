import { config } from 'dotenv';
config();
import http from 'http';
import app from './server/app.js';
import logger from './server/logger.js';

const port = process.env.PORT || 8080;
app.set('port', port);
const server = http.createServer(app);

server.listen(port, () => {
  logger.info(`MoodMap API listening on port ${port}`);
});

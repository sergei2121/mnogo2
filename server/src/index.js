import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import appRoutes from './routes/apps.js';
import userRoutes from './routes/users.js';
import launchRoutes from './routes/launch.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDB();

// Routes
app.use('/api/auth', authRoutes(db));
app.use('/api/apps', appRoutes(db));
app.use('/api/users', userRoutes(db));
app.use('/api/launch', launchRoutes(db));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Multi Launcher Server running on port ${PORT}`);
});

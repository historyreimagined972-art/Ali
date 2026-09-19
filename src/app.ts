import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// 1. Security headers (disable crossOrigin policies that conflict with CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// 2. CORS — manual implementation (cors package has compatibility issues with Express 5)
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// 3. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parsing
app.use(cookieParser());

// 5. NoSQL injection prevention (custom — express-mongo-sanitize v2 is incompatible with Express 5)
function sanitize(obj: any): void {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      }
    }
  }
}
app.use((req, _res, next) => {
  sanitize(req.body);
  sanitize(req.params);
  next();
});

// 6. HTTP request logging (dev only)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 7. Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 8. Health endpoints (before strict rate limits)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req, res) => {
  res.status(200).json({ status: 'ready' });
});

// 9. Strict auth-route rate limit
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  skipSuccessfulRequests: true,
});
app.use('/api/v1/auth', authLimiter);

// 10. API routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import taxonomyRoutes from './modules/taxonomy/taxonomy.routes.js';
import videoRoutes from './modules/videos/video.routes.js';
import doubtRoutes from './modules/doubts/doubt.routes.js';
import testRoutes from './modules/tests/test.routes.js';
import pastPaperRoutes from './modules/pastpapers/pastpaper.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/taxonomy', taxonomyRoutes);
app.use('/api/v1/content', videoRoutes);
app.use('/api/v1/doubts', doubtRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/past-papers', pastPaperRoutes);

app.get('/api/v1', (_req, res) => {
  res.status(200).json({ 
    success: true, 
    data: { message: 'AI Tutor API v1' } 
  });
});

// 11. Central error handler (always last)
app.use(errorHandler);

export default app;

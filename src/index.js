import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { rateLimitMiddleware } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import roleRoutes from "./routes/role.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import userPermissionRoutes from "./routes/user_permission.routes.js";

const app = express();

// Security Headers (Industry Standard)
app.use(helmet());

// Apply global rate limiting (Leaky Bucket: 3 req/sec)
app.use(rateLimitMiddleware);

// Standard middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Morgan logging for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Simple logging for production errors
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/user-permissions', userPermissionRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('RBAC System API is running...');
});

// Global Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

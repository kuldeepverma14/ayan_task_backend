import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ApiError } from '../utils/ApiError.js';

// Global Rate Limiter: 10 points per second (Leaky Bucket concept)
const rateLimiter = new RateLimiterMemory({
  points: 10, 
  duration: 1,
  execEvenly: true, 
});

export const rateLimitMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      // Return 429 error instead of crashing the server
      next(new ApiError(429, "Too many requests. Please try again later."));
    });
};

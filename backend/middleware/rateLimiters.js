const rateLimit = require('express-rate-limit');

const build = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message }
  });

const MINUTE = 60 * 1000;

// Applied per IP; the app sets `trust proxy` so this works behind Render's load balancer.
module.exports = {
  authLimiter: build({ windowMs: 15 * MINUTE, limit: 20, message: 'Too many attempts, please try again later' }),
  publicWriteLimiter: build({ windowMs: 15 * MINUTE, limit: 30, message: 'Too many requests, please try again later' }),
  orderLimiter: build({ windowMs: 60 * MINUTE, limit: 30, message: 'Too many orders submitted, please try again later' }),
  generalLimiter: build({ windowMs: MINUTE, limit: 300, message: 'Too many requests, please slow down' })
};

import rateLimit from "express-rate-limit";

function createRateLimiter(minutes: number, maxRequests: number) {
    return rateLimit({
        windowMs: minutes * 60 * 1000,

        limit: maxRequests,

        handler: (_req, res) => {
            res.status(429).json({
                status: 'error',
                error: 'Too many requests, please try again later.'
            });
        }
    });
}

export default createRateLimiter;
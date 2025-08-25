import express from 'express';
import cors from 'cors';
// import helmet from 'helmet';
// import compression from 'compression';
// import { requestLog, rotateLog } from '../src/Utils/logFunction/logFunction';
// import { logger } from '../src/Utils/logger/logger';
// import createRateLimiter from '../src/Middlewares/rateLimiter/rateLimiter.middleware';
// import { sanitizeRequestData } from '../src/Middlewares/sanitizeData/sanitizeData.middleware';

const configMiddleware = (app: express.Application) => {

    require('dotenv').config({ quiet: true });

    app.use(express.json());

    app.use(cors());

    // app.use(helmet());
    //
    // app.use(compression(
    //     {
    //         threshold: 1024,
    //         filter: (req: Request) => {
    //             if (req.headers['x-no-compression']) {
    //                 return false;
    //             }
    //             return !req.path.match(/\.(jpg|jpeg|png|gif|pdf|svg|mp4)$/i);
    //         }
    //     }
    // ));

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

    // const limiter = createRateLimiter(15, 100);
    // app.use(limiter);
    //
    // app.use(sanitizeRequestData);
    //
    // app.use((req, res, next) => {
    //     rotateLog();
    //     requestLog(req, res, next);
    //
    //     logger.info(` ${req.method} - ${req.url} - IP:  ${req.ip}`);
    // });
};

export default configMiddleware;
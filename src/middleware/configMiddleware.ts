import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import createRateLimiter from "./rateLimiterMiddleware";

const configMiddleware = (app: express.Application) => {

    const { xss } = require('express-xss-sanitizer');

    require('dotenv').config({ quiet: true });

    app.use(express.json());

    app.use(cors());

    app.use(helmet());

    app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

    const limiter = createRateLimiter(15, 100);

    app.use(limiter);

    app.use(xss());

};

export default configMiddleware;
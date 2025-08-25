import express from 'express';
import taskRoute from "./route/taskRoute";
import configMiddleware from "./middleware/configMiddleware";
import authRoutes from './route/authRoute';

const app = express();

configMiddleware(app);

app.use('/api/task', taskRoute);
app.use('/api/auth', authRoutes);


// app.use(errorHandler);


export { app };
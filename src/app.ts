import express from 'express';
import taskRoute from "./route/taskRoute";
import configMiddleware from "./middleware/configMiddleware";
import authRoute from './route/authRoute';
import locationRoute from "./route/locationRoute";
import pokemonRoute from "./route/pokemonRoute";
import itemRoute from "./route/itemRoute";
import {errorHandler} from "./middleware/errorHandlerMiddleware";
import passport from "./lib/passport";
import {logRequest} from "./middleware/logMiddleware";

const app = express();

configMiddleware(app);
app.use(passport.initialize());
app.use(logRequest);

app.use('/api/task', taskRoute);
app.use('/api/auth', authRoute);
app.use('/api/location', locationRoute);
app.use('/api/pokemon', pokemonRoute);
app.use('/api/item', itemRoute);

app.use(errorHandler);

export { app };
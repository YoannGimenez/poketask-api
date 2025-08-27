import { app } from './app';
import prisma from './lib/prisma';
import passport from './lib/passport';
import { startTaskRegenerationCron } from './service/taskRecreateCron';

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

const server = app.listen(PORT, () => {
    console.log(`Server running on ${API_URL}:${PORT}`);
});

app.use(passport.initialize());
startTaskRegenerationCron();


process.on('SIGINT', async () => {
    console.log("Server shutdown...");
    await prisma.$disconnect();
    server.close(() => {
        console.log("Server stopped successfully.");
        process.exit(0);
    });
});
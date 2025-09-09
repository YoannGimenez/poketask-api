import { app } from './app';
import prisma from './lib/prisma';
import { startTaskRegenerationCron } from './service/taskRecreateCron';
import {connectMongo} from "./lib/mongoose";
import mongoose from "mongoose";

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

async function checkDatabases() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("Postgres connecté");

        await connectMongo();
    } catch (error) {
        console.error("Impossible de se connecter à la base de données :", error);
        process.exit(1);
    }
}

async function startServer() {
    await checkDatabases();

    const server = app.listen(PORT, () => {
        console.log(`Server running on ${API_URL}:${PORT}`);
    });

    startTaskRegenerationCron();

    process.on('SIGINT', async () => {
        console.log("Server shutdown...");
        await prisma.$disconnect();
        await mongoose.disconnect();
        server.close(() => {
            console.log("Server stopped successfully.");
            process.exit(0);
        });
    });
}

startServer();
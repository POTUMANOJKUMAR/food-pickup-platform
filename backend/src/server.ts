import { createServer, type Server } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";

let server: Server | undefined;
let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");

  const forceShutdownTimer = setTimeout(() => {
    logger.fatal("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceShutdownTimer.unref();

  if (server !== undefined) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  await prisma.$disconnect();
  clearTimeout(forceShutdownTimer);
  logger.info("Graceful shutdown completed");
};

const bootstrap = async (): Promise<void> => {
  await prisma.$connect();
  logger.info("PostgreSQL connection established");

  const app = createApp();
  server = createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "API server is listening");
  });
};

process.once("SIGINT", () => {
  void shutdown("SIGINT").then(() => process.exit(0)).catch((error: unknown) => {
    logger.error({ error }, "Shutdown failed");
    process.exit(1);
  });
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM").then(() => process.exit(0)).catch((error: unknown) => {
    logger.error({ error }, "Shutdown failed");
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  void shutdown("SIGTERM").finally(() => process.exit(1));
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ error }, "Uncaught exception");
  void shutdown("SIGTERM").finally(() => process.exit(1));
});

void bootstrap().catch((error: unknown) => {
  logger.fatal({ error }, "Application bootstrap failed");
  void prisma.$disconnect().finally(() => process.exit(1));
});

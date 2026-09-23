import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { requireAuth } from "./modules/auth/auth.middleware.js";
import { fileRouter } from "./modules/files/file.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { measurementRouter } from "./modules/measurements/measurement.routes.js";
import { openApiDocument } from "./openapi.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.TRUST_PROXY ? 1 : false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);
app.use(express.json({ limit: "32kb" }));

app.use("/health", healthRouter);
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/openapi.json", (_request, response) => response.json(openApiDocument));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/auth", authRouter);
app.use("/api/measurements/:id/file", requireAuth, fileRouter);
app.use("/api/measurements", requireAuth, measurementRouter);

const webDistPath = fileURLToPath(new URL("../../web/dist", import.meta.url));
if (existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get(/^(?!\/api(?:\/|$)|\/health(?:\/|$)).*/, (_request, response) => {
    response.sendFile("index.html", { root: webDistPath });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

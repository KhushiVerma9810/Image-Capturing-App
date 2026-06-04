import { createApp } from "./app.js";
import { connectMongo } from "./config/mongo.js";
import { env } from "./config/env.js";
import { seedSystemData } from "./services/auth.service.js";
import { ensureDirectory } from "./utils/file-system.js";
import { serverRoot } from "./utils/app-paths.js";

async function bootstrap() {
  await connectMongo();
  await ensureDirectory(`${serverRoot}/${env.UPLOAD_DIR}`);
  await seedSystemData();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

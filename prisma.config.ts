import { defineConfig, env } from "prisma/config";
import 'dotenv/config'; 
export default defineConfig({
  schema: "prisma/schema.prisma",

  engine: "classic",

  datasource: {
    url: env("DATABASE_URL"),       // MUST MATCH schema.prisma
    directUrl: env("DIRECT_URL"),   // Needed for prisma
  },
});

import { defineConfig } from "prisma/config";
import 'dotenv/config'; 
export default defineConfig({
  schema: "prisma/schema.prisma",

  engine: "classic",

  datasource: {
    url: process.env.DATABASE_URL || "postgresql://dummy",
    directUrl: process.env.DIRECT_URL || "postgresql://dummy",
  },
});

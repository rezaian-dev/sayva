import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

import { mongoClient, mongoDb } from "@/lib/db/mongodb";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const isProductionRuntime = process.env.NODE_ENV === "production" && !isProductionBuild;
const configuredSiteUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
const siteUrl = configuredSiteUrl || "http://localhost:3000";
const configuredSecret = process.env.BETTER_AUTH_SECRET;

if (isProductionRuntime && !configuredSecret) {
  throw new Error("BETTER_AUTH_SECRET must be configured before starting SAYVA in production.");
}
if (isProductionRuntime && !configuredSiteUrl) {
  throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_SITE_URL must be configured before starting SAYVA in production.");
}

/**
 * Better Auth is the single authority for account identity, password
 * hashing, cookies, sessions, and token lifecycle.
 */
export const auth = betterAuth({
  baseURL: siteUrl,
  secret: configuredSecret ?? "sayva-local-development-secret-change-before-production",
  database: mongodbAdapter(mongoDb, {
    client: mongoClient,
    // The approved local MongoDB instance is expected to be standalone.
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: "learner",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});

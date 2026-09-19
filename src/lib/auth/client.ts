"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-only Better Auth helper. Server secrets and server configuration
 * are intentionally not imported into Client Components.
 */
export const authClient = createAuthClient();

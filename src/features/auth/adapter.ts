import { httpAdapter } from "./adapters/http";
import { mockAdapter } from "./adapters/mock";
import type { AuthAdapter } from "./types";

export const AUTH_MOCK_ENABLED = import.meta.env.VITE_AUTH_MOCK === "true";

export const authAdapter: AuthAdapter = AUTH_MOCK_ENABLED ? mockAdapter : httpAdapter;

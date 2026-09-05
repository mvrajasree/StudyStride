import { createApp } from "../server/_core/app";

// Vercel invokes the exported Express app as the serverless handler.
// vercel.json rewrites /api/* and /manus-storage/* to this function; the
// Express app matches against the original request path.
export default createApp();

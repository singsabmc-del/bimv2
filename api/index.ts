// Vercel serverless entry: runs the same Express /api routes as server.ts,
// so the deployed site can save and load school data to/from Supabase.
import { createApp } from '../server.js';

const appPromise = createApp();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}

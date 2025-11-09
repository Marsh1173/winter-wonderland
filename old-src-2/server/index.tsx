import { serve } from "bun";
import index from "../frontend/index.html";

const files_server = serve({
  port: Bun.env.FILES_PORT,
  routes: {
    "/": index,
  },

  development:
    process.env.NODE_ENV !== "production" &&
    {
      // // Enable browser hot reloading in development
      // hmr: true,
    },
});

console.log(`🚀 Server running at ${files_server.url}`);

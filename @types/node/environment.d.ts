declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production";
      PORT?: string;
      FASTIFY_CLOSE_GRACE_DELAY?: string;
    }
  }
}

export {};

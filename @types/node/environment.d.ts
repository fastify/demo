declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      LOGGING?: number;
      FASTIFY_CLOSE_GRACE_DELAY: number;
    }
  }
}

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      FASTIFY_CLOSE_GRACE_DELAY: number;
    }
  }
}

export {};

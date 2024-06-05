declare module 'fastify' {
  export interface FastifyInstance<
      HttpServer = http.Server,
      HttpRequest = http.IncomingMessage,
      HttpResponse = http.ServerResponse
    > {
    someSupport(): void
  }
}

export {}

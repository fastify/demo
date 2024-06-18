import { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", ({ protocol, hostname }) => {
    return {
      message:
        "See documentation at " + `${protocol}://${hostname}/documentation`
    };
  });
}

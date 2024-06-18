import { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", ({ user, protocol, hostname }) => {
    return {
      message:
        `Hello ${user.username}! See documentation at ${protocol}://${hostname}/documentation`
    };
  });
}

import fastifyJwt from "@fastify/jwt";
import { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    secret: fastify.config.JWT_SECRET
  };
};

export default fastifyJwt;

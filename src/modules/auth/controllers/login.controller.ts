import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function login(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    // For demonstration purpose
    fastify.authService.login()
}

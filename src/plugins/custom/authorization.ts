import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";
import { Auth } from "../../schemas/auth.js";

declare module "fastify" {
  export interface FastifyInstance {
    isModerator: typeof isModerator;
    isAdmin: typeof isAdmin;
  }
}

function verifyAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  role: string
) {
  if (!request.user || !(request.user as Auth).roles.includes(role)) {
    reply.status(403).send("You are not authorized to access this resource.");
  }
}

async function isModerator(request: FastifyRequest, reply: FastifyReply) {
  verifyAccess(request, reply, 'moderator')
}

async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
  verifyAccess(request, reply, 'admin')
}

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see {@link https://github.com/fastify/fastify-plugin}
 */
export default fp(
  async function (fastify) {
    fastify.decorate("isModerator", isModerator);
    fastify.decorate("isAdmin", isAdmin);
    // You should name your plugins if you want to avoid name collisions
    // and/or to perform dependency checks.
  },
  { name: "authorization", dependencies: ["mysql"] }
);

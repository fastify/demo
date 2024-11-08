import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { login } from './login.controller.js'

const controllers = {
  login
}

const createAuthController = (fastify: FastifyInstance) => {
  async function login (request: FastifyRequest, reply: FastifyReply) {
    return controllers.login(fastify, request, reply)
  }

  return {
    login
  }
}

export default createAuthController

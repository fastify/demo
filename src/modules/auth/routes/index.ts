import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";
import createAuthController from '../controllers/index.js'




const authRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  const authController = createAuthController(fastify)
  fastify.post('', {}, authController.login)
}

export default authRoutes

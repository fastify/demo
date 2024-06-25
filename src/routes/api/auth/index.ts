import {
  FastifyPluginAsyncTypebox,
  Type
} from "@fastify/type-provider-typebox";
import { CredentialsSchema, IAuth } from "../../../schemas/auth.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/login",
    {
      schema: {
        body: CredentialsSchema,
        response: {
          200: Type.Object({
            token: Type.String()
          }),
          401: Type.Object({
            message: Type.String()
          })
        },
        tags: ["Authentication"]
      }
    },
    async function (request, reply) {
      const { username, password } = request.body;

      const user = await fastify.repository.find<IAuth>('users', {
        select: 'username, password',
        where: { username }
      })

      if (user) {
        const isPasswordValid = await fastify.compare(password, user.password);
        if (isPasswordValid) {
          const token = fastify.jwt.sign({ username: user.username });

          return { token };
        }
      }

      reply.status(401);
      
      return { message: "Invalid username or password." };
    }
  );
};

export default plugin;

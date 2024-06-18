import {
  FastifyPluginAsyncTypebox,
  Type
} from "@fastify/type-provider-typebox";
import { CredentialsSchema } from "../../../schemas/auth.js";

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

      if (username === "basic" && password === "password") {
        const token = fastify.jwt.sign({ username });

        return { token };
      }

      reply.status(401);

      return { message: "Invalid username or password." };
    }
  );
};

export default plugin;

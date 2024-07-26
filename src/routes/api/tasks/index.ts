import {
  FastifyPluginAsyncTypebox,
  Type
} from "@fastify/type-provider-typebox";
import { TaskSchema } from "../../../schemas/tasks.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(TaskSchema)
        },
        tags: ["Tasks"]
      }
    },
    async function () {
      return [{ id: 1, name: "Do something..." }];
    }
  );
};

export default plugin;

import {
  FastifyPluginAsyncTypebox,
  Type
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Prefixed with /example by the autoloader
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Object({
            message: Type.String()
          })
        },
        tags: ["Example"]
      }
    },
    async function () {
      return { message: "This is an example" };
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          digit: Type.Number({ minimum: 0, maximum: 9 })
        }),
        response: {
          200: Type.Object({
            message: Type.String()
          })
        },
        tags: ["Example"]
      }
    },
    async function (req) {
      const { digit } = req.body;

      return { message: `Here is the digit you sent: ${digit}` };
    }
  );
};

export default plugin;

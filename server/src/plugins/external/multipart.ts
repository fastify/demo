import fastifyMultipart from '@fastify/multipart'

export const autoConfig = {
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 100, // Max field value size in bytes
    fields: 10, // Max number of non-file fields
    fileSize: 1 * 1024 * 1024, // Max file size in bytes (5 MB)
    files: 1, // Max number of file fields
    parts: 1000 // Max number of parts
  }
}

/**
 * This plugins allows to parse the multipart content-type
 *
 * @see {@link https://github.com/fastify/fastify-multipart}
 */
export default fastifyMultipart

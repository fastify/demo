import { it } from 'node:test'
import Fastify from 'fastify'
import assert from 'node:assert'
import Env, { autoConfig } from '../../src/plugins/external/env.js'

it('UPLOAD_DIRNAME should not contain ..', async (t) => {
  const { schema: { type, properties: { UPLOAD_DIRNAME } }, ...otherAutoConfig } = autoConfig

  const failPath = ['/../', '../', '/..', `${UPLOAD_DIRNAME.default}/../${UPLOAD_DIRNAME.default}`, `../${UPLOAD_DIRNAME.default}`, `${UPLOAD_DIRNAME.default}/..`]
  for (let i = 0; i < failPath.length; i++) {
    process.env.UPLOAD_DIRNAME = failPath[i]
    const fastify = Fastify()
    fastify.register(Env, { ...otherAutoConfig, schema: { type, properties: { UPLOAD_DIRNAME } } })

    try {
      await fastify.ready()
      assert.fail('should failed')
    } catch (error) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, `env/UPLOAD_DIRNAME must match pattern "${UPLOAD_DIRNAME.pattern}"`)
      } else {
        assert.fail('should failed')
      }
    } finally {
      await fastify.close()
    }
  }

  const successPath = [UPLOAD_DIRNAME.default]
  for (let i = 0; i < successPath.length; i++) {
    process.env.UPLOAD_DIRNAME = successPath[i]
    const fastify = Fastify()
    fastify.register(Env, { ...otherAutoConfig, schema: { type, properties: { UPLOAD_DIRNAME } } })

    try {
      await fastify.ready()
    } catch (error) {
      assert.fail('should succeed')
    } finally {
      await fastify.close()
    }
  }
})

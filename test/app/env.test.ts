import { it } from 'node:test'
import Fastify from 'fastify'
import assert from 'node:assert'
import Env, { autoConfig } from '../../src/plugins/external/env.js'

it('UPLOAD_DIRNAME should not contain ..', async (t) => {
  const { confKey, schema: { type, properties: { UPLOAD_DIRNAME } } } = autoConfig

  const failPath = ['/../', '../', '/..']
  for (let i = 0; i < failPath.length; i++) {
    const fastify = Fastify()
    await assert.rejects(async () => {
      await fastify.register(Env, { confKey, dotenv: false, data: {}, schema: { type, properties: { UPLOAD_DIRNAME: { ...UPLOAD_DIRNAME, default: failPath[i] } } } })
    }, { message: `env/UPLOAD_DIRNAME must match pattern "${UPLOAD_DIRNAME.pattern}"` }).finally(async () => {
      await fastify.close()
    })
  }
})

it('UPLOAD_DIRNAME.default should be a valid dirname', async (t) => {
  const { confKey, schema: { type, properties: { UPLOAD_DIRNAME } } } = autoConfig

  const fastify = Fastify()
  await assert.doesNotReject(async () => {
    await fastify.register(Env, { confKey, dotenv: false, data: {}, schema: { type, properties: { UPLOAD_DIRNAME: { ...UPLOAD_DIRNAME, default: UPLOAD_DIRNAME.default } } } })
  }).finally(async () => {
    await fastify.close()
  })
})

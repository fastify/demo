import { test } from 'node:test'
import Fastify from 'fastify'
import scryptPlugin from '../../src/plugins/app/password-manager.js'
import assert from 'node:assert'

test('scrypt works standalone', async t => {
  const app = Fastify()

  t.after(() => app.close())

  app.register(scryptPlugin)

  await app.ready()

  const password = 'test_password'
  const { passwordManager } = app
  const hash = await passwordManager.hash(password)
  assert.ok(typeof hash === 'string')

  const isValid = await passwordManager.compare(password, hash)
  assert.ok(isValid, 'compare should return true for correct password')

  const isInvalid = await passwordManager.compare('wrong_password', hash)
  assert.ok(!isInvalid, 'compare should return false for incorrect password')

  await assert.rejects(
    () => passwordManager.compare(password, 'malformed_hash'),
    'compare should throw an error for malformed hash'
  )
})

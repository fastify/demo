import { test } from "tap";
import assert from "node:assert";
import { execSync } from "child_process";
import Fastify from "fastify";
import repository from "../../src/plugins/custom/repository.js";
import * as envPlugin from "../../src/plugins/external/1-env.js";
import * as mysqlPlugin from "../../src/plugins/external/mysql.js";
import { Auth } from '../../src/schemas/auth.js';

test("repository works standalone", async (t) => {
  const app = Fastify();

  t.after(() => {
    app.close();
    // Run the seed script again to clean up after tests
    execSync('npm run seed:db');
  });

  app.register(envPlugin.default, envPlugin.autoConfig);
  app.register(mysqlPlugin.default, mysqlPlugin.autoConfig);
  app.register(repository);

  await app.ready();

  // Test find method
  const user = await app.repository.find<Auth>('users', { select: 'username', where: { username: 'basic' } });
  assert.deepStrictEqual(user, { username: 'basic' });

  const firstUser = await app.repository.find<Auth>('users', { select: 'username' });
  assert.deepStrictEqual(firstUser, { username: 'basic' });

  const nullUser  = await app.repository.find<Auth>('users', { select: 'username', where: { username: 'unknown' } });
  assert.equal(nullUser, null);

  // Test findMany method
  const users = await app.repository.findMany<Auth>('users', { select: 'username', where: { username: 'basic' } });
  assert.deepStrictEqual(users, [
    { username: 'basic' }
  ]);

  // Test findMany method
  const allUsers = await app.repository.findMany<Auth>('users', { select: 'username' });
  assert.deepStrictEqual(allUsers, [
    { username: 'basic' },
    { username: 'moderator' },
    { username: 'admin' }
  ]);

  // Test create method
  const newUserId = await app.repository.create('users', { data: { username: 'new_user', password: 'new_password' } });
  const newUser = await app.repository.find<Auth>('users', { select: 'username', where: { id: newUserId } });
  assert.deepStrictEqual(newUser, { username: 'new_user' });

  // Test update method
  const updateCount = await app.repository.update('users', { data: { password: 'updated_password' }, where: { username: 'new_user' } });
  assert.equal(updateCount, 1);
  const updatedUser = await app.repository.find<Auth>('users', { select: 'password', where: { username: 'new_user' } });
  assert.deepStrictEqual(updatedUser, { password: 'updated_password' });

  // Test delete method
  const deleteCount = await app.repository.delete('users', { username: 'new_user' });
  assert.equal(deleteCount, 1);
  const deletedUser = await app.repository.find<Auth>('users', { select: 'username', where: { username: 'new_user' } });
  assert.equal(deletedUser, null);
});

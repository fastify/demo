import { Client } from 'pg'
import { scryptHash } from '../src/plugins/app/password-manager.js'

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error("You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation.")
}

async function seed () {
  const connection = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  })

  try {
    await connection.connect()
    await truncateTables(connection)
    await seedUsers(connection)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await connection.end()
  }
}

async function truncateTables (connection: Client) {
  const { rows } = await connection.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  )

  if (rows.length === 0) {
    return
  }

  const tableNames = rows
    .map((row) => `"${String(row.tablename).replace(/"/g, '""')}"`)
    .join(', ')

  await connection.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
  console.log('All tables have been truncated successfully.')
}

async function seedUsers (connection: Client) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ]
  const hash = await scryptHash('Password123$')

  // The goal here is to create a role hierarchy
  // E.g. an admin should have all the roles
  const rolesAccumulator: number[] = []

  for (const user of users) {
    const userResult = await connection.query(
      `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [user.username, user.email, hash]
    )

    const userId = userResult.rows[0]?.id

    const roleResult = await connection.query(
      `
      INSERT INTO roles (name)
      VALUES ($1)
      RETURNING id
      `,
      [user.username]
    )

    const newRoleId = roleResult.rows[0]?.id

    rolesAccumulator.push(newRoleId)

    for (const roleId of rolesAccumulator) {
      await connection.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        `,
        [userId, roleId]
      )
    }
  }

  console.log('Users have been seeded successfully.')
}

seed()

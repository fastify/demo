import { createConnection, Connection } from 'mysql2/promise'
import { scryptHash } from '../src/plugins/app/password-manager.js'

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error("You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation.")
}

async function seed () {
  const connection: Connection = await createConnection({
    multipleStatements: true,
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD
  })

  try {
    await truncateTables(connection)
    await seedUsers(connection)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await connection.end()
  }
}

async function truncateTables (connection: Connection) {
  const [tables]: any[] = await connection.query('SHOW TABLES')

  if (tables.length > 0) {
    const tableNames = tables.map(
      (row: Record<string, string>) => row[`Tables_in_${process.env.MYSQL_DATABASE}`]
    )
    const truncateQueries = tableNames
      .map((tableName: string) => `TRUNCATE TABLE \`${tableName}\``)
      .join('; ')

    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    try {
      await connection.query(truncateQueries)
      console.log('All tables have been truncated successfully.')
    } finally {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    }
  }
}

async function seedUsers (connection: Connection) {
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
    const [userResult] = await connection.execute(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `, [user.username, user.email, hash])

    const userId = (userResult as { insertId: number }).insertId

    const [roleResult] = await connection.execute(`
      INSERT INTO roles (name)
      VALUES (?)
    `, [user.username])

    const newRoleId = (roleResult as { insertId: number }).insertId

    rolesAccumulator.push(newRoleId)

    for (const roleId of rolesAccumulator) {
      await connection.execute(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (?, ?)
      `, [userId, roleId])
    }
  }

  console.log('Users have been seeded successfully.')
}

seed()

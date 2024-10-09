import { createConnection, Connection } from 'mysql2/promise'
import { scryptHash } from '../src/plugins/custom/scrypt.js'

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

    /* c8 ignore start */
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    /* c8 ignore end */
    await connection.end()
  }
}

async function truncateTables (connection: Connection) {
  const [tables]: any[] = await connection.query('SHOW TABLES')

  if (tables.length > 0) {
    const tableNames = tables.map(
      (row: { [key: string]: string }) => row[`Tables_in_${process.env.MYSQL_DATABASE}`]
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
  const usernames = ['basic', 'moderator', 'admin']
  const hash = await scryptHash('password123$')

  // The goal here is to create a role hierarchy
  // E.g. an admin should have all the roles
  const rolesAccumulator: number[] = []

  for (const username of usernames) {
    const [userResult]: any[] = await connection.execute(`
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `, [username, hash])

    const userId = (userResult as { insertId: number }).insertId

    const [roleResult]: any[] = await connection.execute(`
      INSERT INTO roles (name)
      VALUES (?)
    `, [username])

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

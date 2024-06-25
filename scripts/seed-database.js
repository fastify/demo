import { createConnection } from 'mysql2/promise'
import bcrypt from 'bcrypt'

async function seed () {
  const connection = await createConnection({
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

async function truncateTables (connection) {
  const [tables] = await connection.query('SHOW TABLES')

  if (tables.length > 0) {
    const tableNames = tables.map((row) => row[`Tables_in_${process.env.MYSQL_DATABASE}`])
    const truncateQueries = tableNames.map((tableName) => `TRUNCATE TABLE \`${tableName}\``).join('; ')

    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    try {
      await connection.query(truncateQueries)
      console.log('All tables have been truncated successfully.')
    } finally {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    }
  }
}

async function seedUsers (connection) {
  const usernames = ['basic', 'moderator', 'admin']

  for (const username of usernames) {
    const hash = await bcrypt.hash('password', 10)

    const insertUserQuery = `
      INSERT INTO users (username, password)
      VALUES (?, ?)
    `

    await connection.execute(insertUserQuery, [username, hash])
  }

  console.log('Users have been seeded successfully.')
}

seed()

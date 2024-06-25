import { MySQLPromisePool } from "@fastify/mysql";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export type IRepository = MySQLPromisePool & ReturnType<typeof createRepository>;

type QuerySeparator = 'AND' | ',';

type QueryOptions = {
  select?: string;
  where?: Record<string, any>;
};

type WriteOptions = {
  data: Record<string, any>;
  where?: Record<string, any>;
};

function createRepository(fastify: FastifyInstance) {
  const processAssignementRecord = (record: Record<string, any>, separator: QuerySeparator) => {
    const keys = Object.keys(record);
    const values = Object.values(record);
    const clause = keys.map((key) => `${key} = ?`).join(` ${separator} `);

    return [clause, values] as const;
  };

  const repository = {
    ...fastify.mysql,
    find: async <T>(table: string, opts: QueryOptions): Promise<T | null> => {
      const { select = '*', where = {1:1} } = opts;
      const [clause, values] = processAssignementRecord(where, 'AND');

      const query = `SELECT ${select} FROM ${table} WHERE ${clause} LIMIT 1`;
      const [rows] = await fastify.mysql.query<RowDataPacket[]>(query, values);
      if (rows.length < 1) {
        return null;
      }

      return rows[0] as T;
    },

    findMany: async <T>(table: string, opts: QueryOptions): Promise<T[]> => {
      const { select = '*', where = {1:1} } = opts;
      const [clause, values] = processAssignementRecord(where, 'AND');

      const query = `SELECT ${select} FROM ${table} WHERE ${clause}`;
      const [rows] = await fastify.mysql.query<RowDataPacket[]>(query, values);

      return rows as T[];
    },

    create: async (table: string, opts: WriteOptions): Promise<number> => {
      const { data } = opts;
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      const [result] = await fastify.mysql.query<ResultSetHeader>(query, values);

      return result.insertId;
    },

    update: async (table: string, opts: WriteOptions): Promise<number> => {
      const { data, where = {} } = opts;
      const [dataClause, dataValues] = processAssignementRecord(data, ',');
      const [whereClause, whereValues] = processAssignementRecord(where, 'AND');

      const query = `UPDATE ${table} SET ${dataClause} WHERE ${whereClause}`;
      const [result] = await fastify.mysql.query<ResultSetHeader>(query, [...dataValues, ...whereValues]);

      return result.affectedRows;
    },

    delete: async (table: string, where: Record<string, any>): Promise<number> => {
      const [clause, values] = processAssignementRecord(where, 'AND');

      const query = `DELETE FROM ${table} WHERE ${clause}`;
      const [result] = await fastify.mysql.query<ResultSetHeader>(query, values);

      return result.affectedRows;
    }
  };

  return repository;
}

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see https://github.com/fastify/fastify-plugin
 */
export default fp(
  async function (fastify) {
    fastify.decorate("repository", createRepository(fastify));
    // You should name your plugins if you want to avoid name collisions
    // and/or to perform dependency checks.
  },
  { name: "repository", dependencies: ['mysql'] }
);

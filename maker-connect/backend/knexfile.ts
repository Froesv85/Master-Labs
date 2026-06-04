import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'maker',
      password: process.env.DB_PASSWORD || 'maker_password_dev',
      database: process.env.DB_NAME || 'makerconnect',
    },
    migrations: {
      extension: 'ts',
      directory: './src/database/migrations',
    },
    seeds: {
      extension: 'ts',
      directory: './src/database/seeds',
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      extension: 'ts',
      directory: './src/database/migrations',
    },
    seeds: {
      extension: 'ts',
      directory: './src/database/seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

module.exports = config;

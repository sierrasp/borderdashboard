/** Imports */
import 'dotenv/config'
import fs from "fs";
import { Pool } from "pg";
export default class db {
  static SECRET_PASS = process.env.SECRET_PASS;
  static SECRET_USER = process.env.SECRET_USER;
  static SECRET_HOST = process.env.SECRET_HOST;
  static SECRET_DATABASE = process.env.SECRET_DATABASE;
  static async query(q: string) {
    const config = {
      user: this.SECRET_USER, // env var: PGUSER
      database: this.SECRET_DATABASE, // env var: PGDATABASE
      password: this.SECRET_PASS, // env var: PGPASSWORD
      host: this.SECRET_HOST, // Server hosting the postgres database
      port: 27076, // env var: PGPORT
      max: 10, // max number of clients in the pool
      idleTimeoutMillis: 5000,
      ssl: {
        ca: fs.readFileSync('ca.pem'),
      }, // how long a client is allowed to remain idle before being closed
    };
    const pool = new Pool(config);
    try {
      // console.log(q);
      //   console.log(pool)
      const res = await pool.query(q);
      console.log(res.rows);
      return res;

    } catch (err) {
      throw err;
    }
  };
}


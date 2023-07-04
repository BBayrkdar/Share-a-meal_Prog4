const mysql = require("mysql2");
require("dotenv").config();

// Create the connection pool. The pool specific settings are the defaults
const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "2210363",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
  });

  // simple query
pool.getConnection(function (err, conn) {
    // Do something with the connection
    if (err) {
      console.log("error", err);
    }
    if (conn) {
      conn.query(
        "SELECT `id`, `name` FROM `meal`",
        function (err, results, fields) {
          if (err) {
            console.log(err.sqlMessage, " ", err.errno, "", err.code);
          }
          console.log("results: ", results);
        }
      );
      pool.releaseConnection(conn);
    }
  });


pool.on('acquire', function(connection) {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', function() {
  console.log('Waiting for available connection slot');
});

pool.on('release', function(connection) {
  console.log('Connection %d released', connection.threadId);
})

  module.exports = pool;
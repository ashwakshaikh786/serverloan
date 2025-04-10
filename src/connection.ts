import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'a2nlmysql51plsk.secureserver.net',
  user: 'loanadmin',
  password: '4yb20I^f5',
  database: 'loanadmin'
});

export default db;
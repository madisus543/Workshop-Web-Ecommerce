// connect Mysql
let mysql = require('mysql');
const router = require('.');
let con = mysql.createConnection({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

con.connect((err) => {
  if (err) throw err;
  console.log('!!!Connect Database Success!!!')
})

module.exports = con;

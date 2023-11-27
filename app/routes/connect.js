// connect Mysql
let mysql = require('mysql');
const router = require('.');
let con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_ecommerce'
})

con.connect((err) => {
  if (err) throw err;
  console.log('!!!Connect Database Success!!!')
})

module.exports = con;

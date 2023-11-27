var express = require('express');
var router = express.Router();
var con = require('./connect');
var jwt = require('jsonwebtoken');

let secretkey = 'P@ssw0rd';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', (req,res) => {
  res.render("login");
});

router.post('/login', (req,res) => {
  let sql = 'SELECT * FROM tb_user WHERE user = ? AND password = ?'
  let params = [
    req.body['user'],
    req.body['password']
  ]
  con.query(sql,params,(err, result)=> {
    if (err) throw err;

    if (result.length > 0 ){
      //login pass and use jwt
      let id = result[0].id;
      let name = result[0].name;
      let token = jwt.sign({id: id, name: name}, secretkey);

      res.send(token);
    }
    else {
      res.send('username or password invalid!!');
    }
  })
})

module.exports = router;

var express = require('express');
var router = express.Router();
// import connect
let con = require('./connect');

// import jsonwebtoken
let jwt = require('jsonwebtoken');
let secretkey = 'P@ssw0rd';

//import express-session
let session = require('express-session');
router.use(session({
  secret: 'session',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 100 * 60 * 24 * 30  }
}));

router.use((req,res,next) => {
  res.locals.session = req.session;
  next();
})

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

      // เก็บ token กับ name ไว้ใน session
      req.session.token = token;
      req.session.name = name;

      res.redirect('/home');
    }
    else {
      res.send('username or password invalid!!');
    }
  })
})

function isLogin(req,res,next) {
  if (req.session.token != undefined) {
    next();
  } else {
    res.redirect('login');
  }
}

router.get('/home',isLogin, (req,res)=> {
  res.render('home');
})

router.get('/logout', isLogin, (req,res)=> {
  req.session.destroy();
  res.redirect('/login')
})

module.exports = router;

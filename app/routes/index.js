let express = require('express');
let router = express.Router();
let formidable = require('formidable');
let fs = require('fs');

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

// Login system
router.post('/login', (req,res) => {
  let sql = 'SELECT * FROM tb_user WHERE user = ? AND password = ?'
  let params = [
    req.body['user'],
    req.body['password']
  ]
  con.query(sql,params,(err, result)=> {
    if (err) throw err;

    if (result.length > 0 ){
      //login success and use jwt
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

router.get('/changeProfile', isLogin, (req,res)=> {
  let data = jwt.verify(req.session.token, secretkey)
  let sql = 'SELECT * FROM tb_user WHERE id = ?';
  let params = [data.id]

  con.query(sql,params,(err,result)=> {
    if (err) throw err;
  res.render('changeProfile', {user:result[0]});  
  })
  
})

router.post('/changeProfile', isLogin, (req,res)=> {
  let sql = 'UPDATE tb_user SET name = ?, user = ?';
  let params = [
    req.body['name'],
    req.body['user']
  ] 

  if (req.body['password'] != undefined){
    sql += ', password = ?';
    params.push(req.body['password'])
  }

  con.query(sql,params, (err,result)=> {
    if (err) throw err;
    req.session.message = 'Save Success';
    res.redirect('changeProfile');
  })
})

router.get('/user',isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_user ORDER BY id DESC'
  con.query(sql,(err,result)=> {
    if (err) throw err;
    res.render('user', {users:result})
  })
})

router.get('/addUser', isLogin, (req,res)=> {
  res.render('addUser', {user: {}})
})

router.post('/addUser', isLogin, (req,res)=> {
  let sql = 'INSERT INTO tb_user SET ?'
  let params = req.body
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/user')
  })
})

router.get('/editUser/:id', isLogin ,(req,res)=> {
  let sql = "SELECT * FROM tb_user WHERE id = ?";
  let params = req.params.id;

  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.render('addUser', {user: result[0]})
  })
})

router.post('/editUser/:id', isLogin, (req,res)=> {
  let sql = 'UPDATE tb_user SET name = ?, user = ?, password = ?, level = ? WHERE id = ? '
  params = [
    req.body['name'],
    req.body['user'],
    req.body['password'],
    req.body['level'],
    req.params.id
  ]
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/user')
  }) 
})

router.get('/deleteUser/:id', isLogin, (req,res)=> {
  let sql = 'DELETE FROM tb_user WHERE id = ?'
  let params = req.params.id;

  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/user')
  })
})

router.get('/groupProduct', isLogin,(req,res)=> {
  let sql = 'SELECT * FROM tb_group_product ORDER BY id DESC'
  con.query(sql,(err,result)=> {
    if (err) throw err;
    res.render('groupProduct',{groupProducts:result})
  }) 
})
  

router.get('/addgroupProduct', isLogin,(req,res)=> {
  res.render('addgroupProduct',{ groupProducts: {} })
})

router.post('/addgroupProduct', isLogin, (req,res)=> {
  let sql = 'INSERT INTO tb_group_product SET ?';
  let params = req.body;
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/groupProduct')
  })
})

router.get('/editgroupProduct/:id', isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_group_product WHERE id = ?'
  let params = req.params.id;
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.render('addgroupProduct' , { groupProducts: result[0]})
  })
})

router.post('/editgroupProduct/:id', isLogin, (req,res)=> {
  let sql = 'UPDATE tb_group_product SET name = ? WHERE id = ?'
  let params = [
    req.body['name'],
    req.params.id
  ]
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/groupProduct')
  })
})

router.get('/deletegroupProduct/:id', isLogin, (req,res)=> {
  let sql = 'DELETE FROM tb_group_product WHERE id = ?'
  let params = [req.params.id]
  con.query(sql, params, (err,result)=> {
    if (err) throw err;
    res.redirect('/groupProduct')
  })
})

router.get('/product', isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_product ORDER BY id DESC'
  con.query(sql , (err,result)=> {
    if (err) throw err;
    res.render('product', { products: result })
  })
})

router.get('/addProduct', isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_group_product ORDER BY name'
  con.query(sql, (err,result)=> {
    if (err) throw err;
    res.render('addProduct', { product: {}, groupProduct:result })
  })
})

router.post('/addProduct', isLogin, (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, file) => {
    let filePath = file.image[0].filepath;
    let newPath = 'C:/Users/User/Desktop/Programming/Course Full Node.js/Workshop Web Ecommerce/app/public/images/';
    newPath += file.image[0].originalFilename;

    fs.copyFile(filePath, newPath, () => {
      // insert to database
      let sql = 'INSERT INTO tb_product(group_product_id, barcode, name, cost, price, image) VALUES(?, ?, ?, ?, ?, ?)';
      let params = [
        fields['group_product_id'],
        fields['barcode'],
        fields['name'],
        fields['cost'],
        fields['price'],
        file.image[0].originalFilename
      ];
      
      con.query(sql, params, (err, result) => {
        if (err) throw err;
        res.redirect('/product');
      })
      
    })
  })
})
module.exports = router;

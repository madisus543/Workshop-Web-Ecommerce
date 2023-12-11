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
  let sql = 'SELECT * FROM tb_product ORDER BY id DESC';
  con.query(sql, (err,result)=> {
    if (err) throw err;

    if (req.session.card == undefined) {
      req.session.card = [] ;
    }

    res.render('index', { products: result } )
  })
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
  let sql = '' +
  ' SELECT tb_product.*, tb_group_product.name AS group_product_name FROM tb_product' +
  ' LEFT JOIN tb_group_product ON tb_group_product.id = tb_product.group_product_id'+
  ' ORDER BY tb_product.id DESC';
  con.query(sql , (err,result)=> {
    if (err) throw err;
    res.render('product', { products: result })
  })
})

router.get('/addProduct', isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_group_product ORDER BY name'
  con.query(sql, (err,result)=> {
    if (err) throw err;
    res.render('addProduct', { products: {}, groupProducts:result })
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

router.get('/editProduct/:id', isLogin, (req, res)=> {
  let sql = 'SELECT * FROM tb_product WHERE id = ?';
  let params = req.params.id;
  con.query(sql, params, (err,products)=> {
    if (err) throw err;

    sql = 'SELECT * FROM tb_group_product ORDER BY name'
    con.query(sql, (err,groupProducts)=> {
      if (err) throw err;
      res.render('addProduct', { products: products[0], groupProducts:groupProducts })
    })
  })
})

router.post('/editProduct/:id', isLogin, (req, res)=> {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, file) => {
    if (file.image != undefined) {
      let filePath = file.image[0].filepath;
      let newPath = 'C:/Users/User/Desktop/Programming/Course Full Node.js/Workshop Web Ecommerce/app/public/images/';
      let pathUpload = newPath + file.image[0].originalFilename;

      fs.copyFile(filePath, pathUpload, () => {
        let sqlSelect = 'SELECT image FROM tb_product WHERE id = ?'
        let paramSelect = req.params.id;

        con.query(sqlSelect, paramSelect, (err, oldProduct)=> {
          if (err) throw err;
          let product = oldProduct[0];
          fs.unlink(newPath + product.image, (err) => {
            if (err){
              console.log(err);
            }
            // update to database
            let sql = 'UPDATE tb_product SET group_product_id=?, barcode=?, name=?, cost=?, price=?, image=? WHERE id=? ';
            let params = [
              fields['group_product_id'],
              fields['barcode'],
              fields['name'],
              fields['cost'],
              fields['price'],
              file.image[0].originalFilename,
              req.params.id
            ];
            con.query(sql, params, (err, result) => {
              if (err) throw err;
              res.redirect('/product');
            })
          })
        })
      })
    } else {
          // image no change
          let sql = 'UPDATE tb_product SET group_product_id=?, barcode=?, name=?, cost=?, price=? WHERE id=? ';
          let params = [
            fields['group_product_id'],
            fields['barcode'],
            fields['name'],
            fields['cost'],
            fields['price'],
            req.params.id
          ];
          con.query(sql, params, (err, result) => {
            if (err) throw err;
            res.redirect('/product');
          })
    }
  })
})

router.get('/deleteProduct/:id/:image', isLogin, (req,res)=> {
  let newPath = 'C:/Users/User/Desktop/Programming/Course Full Node.js/Workshop Web Ecommerce/app/public/images/';
  newPath += req.params.image;

  fs.unlink(newPath, (err) => {
    if (err) throw err;
    let sql = 'DELETE FROM tb_product WHERE id = ?'
    let params = req.params.id;

    con.query(sql, params, (err, result)=> {
      if (err) throw err;
      res.redirect('/product');
    })
  })
})

router.get('/addToCard/:id', (req,res)=> {
  let card = [];
  let order = {
  product_id: req.params.id,
  qty: 1
  }
  if (req.session.card == null) {
    // first item
    card.push(order);
    } else {
    //second item
    card = req.session.card;
    let qty = 1;
    let newItem = true;

    for (let i = 0; i < card.length; i++) {
      if (card[i].product_id == req.params.id) {
        card[i].qty = card[i].qty + 1;
        newItem = false;
      }
    }
    if (newItem) {
      card.push(order);
    }
  }

  req.session.card = card;
  res.redirect('/')
  //console.log(req.session.card)
})

router.get('/mycart', async (req,res)=> {
  let conn = require('./connect2');
  let cart = req.session.card;
  let products = [];
  let totalQty = 0;
  let totalPrice = 0;

  if (cart.length > 0) {
    for (let i = 0 ; i < cart.length; i++){
      let c = cart[i];
      let sql = 'SELECT * FROM tb_product WHERE id = ?';
      let params = [c.product_id];

      let [row, fields] = await conn.query(sql, params);
      let product = row[0];

      let p = {
        qty: c.qty,
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        image: product.image
      }
      products.push(p);

      totalQty += parseInt(c.qty);
      totalPrice += (c.qty * product.price)
    }
  }
  res.render('mycart', { 
    products: products,
    totalQty: totalQty,
    totalPrice: totalPrice
  });
})

router.get('/deleteItemInCart/:id', (req,res)=> {
  let cart = req.session.card;

  for (let i =0; i < cart.length; i++) {
    if (cart[i].product_id == req.params.id) {
      cart.splice(i, 1);
    }
  }
  req.session.card = cart;
  res.redirect('/mycart');
})

router.get('/editItemInCart/:id', (req,res)=> {
  let sql = 'SELECT * FROM tb_product WHERE id = ?'
  let params = req.params.id;
  con.query(sql, params, (err,result) => {
    if (err) throw err;
    let product = result[0];
    let cart = req.session.card;

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].product_id == product.id) {
        product.qty = cart[i].qty;
      }
    }

    res.render('editItemInCart', {product: product});
  })
})

router.post('/editItemInCart/:id', (req,res)=> {
  let cart = n;

  for (let i =0; i < cart.length; i++) {
    if (cart[i].product_id == req.params.id) {
      cart[i].qty = req.body['qty'];
    }
  }
  req.session.card = cart;
  res.redirect('/mycart')
})

router.get('/confirmOrder', (req,res)=> {
  res.render('confirmOrder')
})

router.post('/confirmOrder', async (req,res)=> {
  let con = require('./connect2');

  // insert into order
  let sql = 'INSERT INTO tb_order(name, address, phone, created_date) VALUES(?, ?, ?, NOW())'
  let params = [
    req.body['name'],
    req.body['address'],
    req.body['phone']
  ]

  try {
    let [rows, fields] = await con.query(sql, params)
    let lastId = rows.insertId;
    let carts = req.session.card;

    for (let i = 0; i < carts.length; i++) {
      let cart = carts[i]
      // find product data
      let sqlFindProduct = 'SELECT price FROM tb_product WHERE id = ?'
      params = [cart.product_id];
      let [rows, fields] = await con.query(sqlFindProduct, params);
      let price = rows[0].price;

      let sqlOrderDetail = 'INSERT INTO tb_order_detail(order_id, product_id, qty, price) VALUES(?, ?, ?, ?)'
      params = [
        lastId,
        cart.product_id,
        cart.qty,
        price
      ]
      await con.query(sqlOrderDetail, params);
    }
  } catch(err) {
    res.send(err);
  }
  req.session.card = []
  res.redirect('/confirmOrderSuccess')
})

router.get('/confirmOrderSuccess', (req,res)=> {
  res.render('confirmOrderSuccess')
})

router.get('/order', isLogin, (req,res)=> {
  let sql = 'SELECT * FROM tb_order ORDER BY id DESC'
  con.query(sql, (err,result)=> {
    if (err) throw err;
    res.render('order', { orders: result })
  })
})

router.get('/orderInfo/:id', isLogin, (req,res)=>{
  let sql = '';
  sql += ' SELECT tb_order_detail.*, tb_product.barcode, tb_product.name, tb_product.image FROM tb_order_detail';
  sql += ' LEFT JOIN tb_product ON tb_product.id = tb_order_detail.product_id';
  sql += ' WHERE tb_order_detail.order_id = ?';
  sql += ' ORDER BY tb_order_detail.id DESC';
  
  let params = [req.params.id];
  let totalQty = 0;
  let totalPrice = 0;

  con.query(sql, params, (err,result)=> {
    if (err) throw err;

    for (let i = 0; i < result.length; i++){
      let orderInfo = result[i]
      totalQty += orderInfo.qty;
      totalPrice += (orderInfo.qty * orderInfo.price)
    }

    res.render('orderInfo', { 
      orderDetails: result, 
      totalQty: totalQty, 
      totalPrice: totalPrice 
    })
  })
})

module.exports = router;

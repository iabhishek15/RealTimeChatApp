var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
var session = require('express-session');
var passport = require('passport');
var methodOverride = require('method-override');
var flash = require('express-flash');
const multer = require('multer');
const helpers = require('./helpers');


//const upload = multer({dest: __dirname + '/uploads/images'});
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'uploads/');
  },

  // By default, multer removes file extensions so let's add them back
  filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});



var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/chattingdb',{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

require('./models');

//getting the user model
var User = mongoose.model('User');
var Message = mongoose.model('Message');

//passport Initialization 
var initializePassport = require('./passportValidate.js');
const { render } = require('ejs');
const { doesNotMatch } = require('assert');
initializePassport(User);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret : 'dfnsnslnfslnfsdlnfssdsds',
  resave : false,
  saveUninitialized : false
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use('/uploads', express.static('uploads'));

app.delete('/logout', function (req, res, next){ 
  req.logOut();
  res.redirect('/login');
}); 


app.get('/', IsAuthenticated, function (req, res, next) {
  User.findOne({
    username : req.user.username
    }, function (err, user) {
      if (err) {
        return next(err);
      }
      return res.render('chat', {
        username : req.user.username,
        friends : user.friends,
        'profileImage' : user.image,
      });
  });
});

app.get('/login', IsNotAuthenticated, function (req, res, next) {
  res.render('login');
});

app.get('/signup', IsNotAuthenticated, function (req, res, next) {
  res.render('signup');
});

app.post('/upload-profile-pic', (req, res) => {
  // 'profile_pic' is the name of our file input field in the HTML form
  let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profile_pic');

  upload(req, res, function(err) {
      // req.file contains information of uploaded file
      // req.body contains information of text fields, if there were any

      if (req.fileValidationError) {
          return res.send(req.fileValidationError);
      }
      else if (!req.file) {
          return res.send('Please select an image to upload');
      }
      else if (err instanceof multer.MulterError) {
          return res.send(err);
      }
      else if (err) {
          return res.send(err);
      }

      // Display uploaded image for user validation
      //console.log("full path ", req.file.path);
      
      //storing the image in the database
      User.updateOne({
        username : req.user.username
      }, { 
        $set : { 
          image : req.file.path
        }
      }, {
        "upsert": false
      }).then((result) => {
        console.log(result);
      }).catch((err) => {
        console.log(err);
      });

      res.redirect('/');
  });
});


app.post('/login', passport.authenticate('local', {
  successRedirect : '/',
  failureRedirect : '/login',
  failureFlash : true
}));

app.post('/signup', function (req, res, next) {
  //console.log(req.body);
  if (req.body.password != req.body.confirmpassword) {
    req.flash('error', 'password do not match');
    return res.redirect('/signup');
  }
  User.findOne({
    username:req.body.username
  }, function (err, user) {
    if (err) return next(err);
    if (user) {
      req.flash('error', 'Username already exits');
      return res.redirect('/signup');
    }
    let newUser = new User({
      username: req.body.username,
      passwordHash: bcrypt.hashSync(req.body.password, 10)
    });
    newUser.save();
    res.redirect('/login');
  })
});


function IsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function IsNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

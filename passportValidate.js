const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function passportValidation(User) {
  passport.use(new localStrategy({
    usernameField : 'username',
    passwordField : 'password'
  }, function (username, password, done) {
    User.findOne({
      username : username
    }, function (err, user) {
      if (err) return done(err);
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return done(null, false, {message : "Incorrect username or password"});
      }
      return done(null, user);
    })
  }));
  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser((id, done) => {
    User.findById(id, function (err, user) {
      return done(err, user);
    })
  });
}


module.exports = passportValidation;

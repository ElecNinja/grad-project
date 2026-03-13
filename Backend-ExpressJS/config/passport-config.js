// Backend-ExpressJS/src/config/passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const supabase = require('./supabase');

function initializePassport(passport) {
  // Strategy بتاعة الـ login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // جيب المستخدم من Supabase
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .limit(1);

        if (error || !users || users.length === 0) {
          return done(null, false, { message: 'No user found with that email.' });
        }

        const user = users[0];

        // قارن الباسورد
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', id)
        .limit(1);

      if (error || !users || users.length === 0) {
        return done(null, false);
      }
      done(null, users[0]);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initializePassport;

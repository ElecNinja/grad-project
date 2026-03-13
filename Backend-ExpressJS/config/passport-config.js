const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const supabase = require('./supabase');

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error || !users || users.length === 0) {
        return done(null, false, { message: 'No user with that email' });
      }

      const user = users[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (error || !users || users.length === 0) return done(null, false);
      done(null, users[0]);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
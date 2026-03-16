const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const supabase = require('./supabase');
print()
function initializePassport(passport) {
  passport.use(new LocalStrategy(
    { usernameField: 'email', passReqToCallback: true }, 
    async (req, email, password, done) => {
      try {
        const role = req.body.role;

        const tableMap = {
          student: 'signup-students',
          teacher: 'signup-teachers',
        };

        const table = tableMap[role];

        if (!table) {
          return done(null, false, { message: 'Invalid role.' });
        }

        // login-users
        const { data: loginData, error: loginError } = await supabase
          .from('login-users')
          .select('id, password')
          .eq('email', email)
          .limit(1);

        if (loginError || !loginData || loginData.length === 0) {
          return done(null, false, { message: 'No user found with that email.' });
        }

      
        const passwordMatch = await bcrypt.compare(password, loginData[0].password);
        if (!passwordMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }

        
        const { data: users, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', loginData[0].id)
          .limit(1);

        if (error || !users || users.length === 0) {
          return done(null, false, { message: 'Profile not found.' });
        }

        return done(null, users[0]);

      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
  });

  passport.deserializeUser(async ({ id, role }, done) => {
    try {
      const tableMap = {
        student: 'signup-students',
        teacher: 'signup-teachers',
      };

      const table = tableMap[role];
      if (!table) return done(null, false);

      const { data: users, error } = await supabase
        .from(table)
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
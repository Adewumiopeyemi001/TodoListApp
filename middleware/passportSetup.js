const passport = require("passport");
const dotenv = require("dotenv");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Models/user.schema");

dotenv.config();

/**
 * Serialize user object to session.
 *
 * @param {Object} user User object to serialize.
 * @param {Function} done Callback function.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user object from session.
 *
 * @param {string} id User ID from session.
 * @param {Function} done Callback function.
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/**
 * Configure Google OAuth2.0 strategy for passport.
 */
passport.use(
  new GoogleStrategy(
    {
      callbackURL: "http://localhost:5000/api/v1/auth/google/redirect",
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if email is provided by Google
        if (!profile.emails || !profile.emails.length) {
          return done(new Error("Email not provided by Google."), null);
        }

        const email = profile.emails[0].value; // Get the first email in the list

        // Check if user with the same email already exists
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Create new user if email is provided and unique
        const newUser = await new User({
          userName: profile.displayName,
          email,
          googleId: profile.id,
          isVerified: true,
        }).save();

        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

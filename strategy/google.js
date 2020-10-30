require('dotenv').config()
const bodyParser = require('body-parser')
const express = require('express')
const passport = require('passport')
var GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(JSON.stringify(profile));
    console.log("Access Token: " + accessToken);
    done(null, profile);
  }
));

const router = express.Router()
router.use(bodyParser.json())

router.use(passport.initialize())
router.use(passport.session())

passport.serializeUser(function (user, done) {
    done(null, user);
})

passport.deserializeUser(function (id, done) {
    done(null, id);
})

router.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

router.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/',
        failureRedirect: '/'
}));

router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

module.exports = router
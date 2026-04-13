const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TaiKhoan = require('../models/taikhoan');

passport.use(new GoogleStrategy({
    clientID: "GOOGLE_CLIENT_ID",
    clientSecret: "GOOGLE_CLIENT_SECRET",
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await TaiKhoan.findOne({ googleId: profile.id });

        if (!user) {
            user = new TaiKhoan({
                googleId: profile.id,
                HoTen: profile.displayName,
                TenDangNhap: profile.emails[0].value,
                QuyenHan: "user"
            });
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await TaiKhoan.findById(id);
    done(null, user);
});

module.exports = passport;
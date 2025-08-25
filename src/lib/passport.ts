import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- Local strategy pour login ---
passport.use(
    new LocalStrategy(
        { usernameField: 'email', passwordField: 'password' },
        async (email, password, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) return done(null, false, { message: 'Utilisateur ou mot de passe incorrect' });

                const isValid = bcrypt.compareSync(password, user.password);
                if (!isValid) return done(null, false, { message: 'Utilisateur ou mot de passe incorrect' });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

// --- JWT strategy pour protéger les routes ---
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET,
        },
        async (payload, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { id: payload.userId } });
                if (!user) return done(null, false);
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

export default passport;

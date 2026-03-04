import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { queryOne } from "./db";
import { comparePassword } from "../utils/password.utils";
import { UserQueries } from "../db/queries/user.queries";
import { IUser } from "../models/types/user.types";
import env from "./env";
import logger from "../utils/logger.utils";

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false, // We use JWT, not sessions
    },
    async (email, password, done) => {
      try {
        // 1. Find user
        const user = await queryOne<IUser>(UserQueries.findByEmail, [
          email.toLowerCase().trim(),
        ]);

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // 2. Check auth provider
        if (user.auth_provider !== "local") {
          return done(null, false, {
            message: `Please use ${user.auth_provider} to login`,
          });
        }

        // 3. Check active
        if (!user.is_active) {
          return done(null, false, { message: "Account deactivated" });
        }

        // 4. Verify password
        if (!user.password_hash) {
          return done(null, false, { message: "Invalid login method" });
        }

        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        logger.debug(`Local auth successful for: ${email}`);
        return done(null, user);
      } catch (error) {
        logger.error(`❌ Local strategy error: ${error}`);
        return done(error);
      }
    }
  )
);


passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        
        // Extract full name from various sources
        let fullName = profile.displayName || "";
        
        // If no displayName, try to combine given and family names
        if (!fullName) {
          const givenName = profile.name?.givenName || "";
          const familyName = profile.name?.familyName || "";
          fullName = `${givenName} ${familyName}`.trim();
        }
        
        // Fallback to email username if no name provided
        if (!fullName || fullName.length === 0) {
          fullName = email?.split("@")[0] || "User";
        }
        
        const avatarUrl = profile.photos?.[0]?.value;
        const providerId = profile.id;

        if (!email) {
          return done(null, false, {
            message: "No email found in Google profile",
          });
        }

        logger.debug(`Google OAuth for: ${email}, full_name: ${fullName}, displayName: ${profile.displayName}`);

        // Return profile data - actual DB logic handled in controller
        return done(null, {
          email,
          full_name: fullName,
          provider: "google" as const,
          providerId,
          avatarUrl,
        });
      } catch (error) {
        logger.error(`❌ Google strategy error: ${error}`);
        return done(error);
      }
    }
  )
);


passport.use(
  "github",
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        let email = profile.emails?.[0]?.value;
        const fullName = profile.displayName || profile.username || "GitHub User";
        const avatarUrl = profile.photos?.[0]?.value;
        const providerId = profile.id;

        if (!email) {
          // Use username@github as fallback
          email = `${profile.username}@github.com`;
        }

        logger.debug(`GitHub OAuth for: ${email}`);

        return done(null, {
          email,
          full_name: fullName,
          provider: "github" as const,
          providerId: String(providerId),
          avatarUrl,
        });
      } catch (error) {
        logger.error(`❌ GitHub strategy error: ${error}`);
        return done(error);
      }
    }
  )
);


passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
import Passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import {Strategy as GitHubStrategy } from "passport-github2"; 
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../../constants";

Passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID || "",
        clientSecret: GOOGLE_CLIENT_SECRET || "",
        callbackURL: "/api/auth/google/callback",
      },
      (accessToken: string, refreshToken: string, profile: any, done: any) => {
          console.log(JSON.stringify(profile));
        return done(null, { profile });
      }
    )
);

Passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        callbackURL: "/api/auth/github/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        const res = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const emails = await res.json();
        profile.email = emails.find((e: any) => e.primary).email;
        return done(null, { profile });
      }
    )
  );


export default Passport;




import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      isAdmin?: boolean;
      isApproved?: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Convert null to undefined for Express User compatibility
          const expressUser = {
            ...user,
            email: user.email ?? undefined,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            profileImageUrl: user.profileImageUrl ?? undefined,
            isApproved: user.isApproved ?? undefined,
            isAdmin: user.isAdmin ?? undefined,
            createdAt: user.createdAt ?? undefined,
            updatedAt: user.updatedAt ?? undefined,
          };
          return done(null, expressUser);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      if (!id) {
        return done(null, false);
      }
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      // Convert null to undefined for Express User compatibility
      const expressUser = {
        ...user,
        email: user.email ?? undefined,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        profileImageUrl: user.profileImageUrl ?? undefined,
        isApproved: user.isApproved ?? undefined,
        isAdmin: user.isAdmin ?? undefined,
        createdAt: user.createdAt ?? undefined,
        updatedAt: user.updatedAt ?? undefined,
      };
      done(null, expressUser);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isApproved: false, // New users need approval
      });

      // Convert null to undefined for Express User compatibility
      const expressUser = {
        ...user,
        email: user.email ?? undefined,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        profileImageUrl: user.profileImageUrl ?? undefined,
        isApproved: user.isApproved ?? undefined,
        isAdmin: user.isAdmin ?? undefined,
        createdAt: user.createdAt ?? undefined,
        updatedAt: user.updatedAt ?? undefined,
      };
      
      req.login(expressUser, (err) => {
        if (err) return next(err);
        res.status(201).json(expressUser);
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function createAdminUser() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("password");
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@lok.com",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isApproved: true,
      });
      console.log("Admin user created with username: admin, password: password");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}
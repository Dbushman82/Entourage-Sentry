import { Express, Request, Response } from "express";
import passport from "passport";
import { db } from "./db";
import { users, type InsertUser, insertUserSchema, loginUserSchema } from "@shared/schema";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

// Helper function to format ZodError messages
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
}

// Register authentication routes
export function setupAuthRoutes(app: Express) {
  // Register a new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const userData = insertUserSchema.parse(req.body);

      // We no longer need to check for existing username, since username is now optional

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hash(userData.password, 10);

      // Create the user - derive username from email if not provided
      const usernameFromEmail = userData.email.split('@')[0];
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          username: usernameFromEmail, // Set username from email
          password: hashedPassword,
          createdAt: new Date()
        })
        .returning();

      // Login the user automatically after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        // Return user data without password
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      });

    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: formatZodError(err) 
        });
      }
      console.error("Registration error:", err);
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  // Login route
  app.post('/api/auth/login', (req: Request, res: Response, next) => {
    try {
      // Validate login data
      loginUserSchema.parse(req.body);
      
      // Log the entire login payload for debugging
      console.log("Login attempt with payload:", {
        email: req.body.email,
        hasPassword: !!req.body.password
      });
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return next(err);
        }
        
        if (!user) {
          console.log("Authentication failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Incorrect email or password" });
        }
        
        console.log("User authenticated, proceeding to login:", user.email);
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return next(loginErr);
          }
          
          // Return user data without password
          const { password, ...userWithoutPassword } = user;
          console.log("User logged in successfully:", userWithoutPassword.email);
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = formatZodError(err);
        console.error("Validation error:", formattedErrors);
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: formattedErrors
        });
      }
      console.error("Login error:", err);
      return next(err);
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
}
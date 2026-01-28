import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface SupabaseAuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseAuthUser;
    }
  }
}

export async function setupSupabaseAuth(app: Express) {
  app.get("/api/login", (req, res) => {
    res.redirect("/auth/login");
  });

  app.get("/api/logout", async (req, res) => {
    res.json({ success: true, message: "Logged out" });
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        await storage.upsertUser({
          id: data.user.id,
          email: data.user.email || email,
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: data.user.user_metadata?.avatar_url || null,
        });
      }

      res.json({ success: true, user: data.user });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      await storage.upsertUser({
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.first_name || null,
        lastName: user.user_metadata?.last_name || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
      });

      res.json({ valid: true, user });
    } catch (error: any) {
      console.error("Token verification error:", error);
      res.status(500).json({ error: "Failed to verify token" });
    }
  });
}

export const isSupabaseAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    req.supabaseUser = {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata as SupabaseAuthUser['user_metadata'],
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const optionalSupabaseAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        req.supabaseUser = {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata as SupabaseAuthUser['user_metadata'],
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};

import { Request, Response, NextFunction } from "express";

// Middleware to check if the user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please log in" });
};

// Middleware to check if the user has the required role
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized - Please log in" });
    }

    const user = req.user as any;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }

    next();
  };
};

// Middleware to ensure user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};

// Middleware to ensure user is a manager
export const isManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }

  const user = req.user as any;
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return res.status(403).json({ message: "Forbidden - Manager access required" });
  }

  next();
};

// Get current authenticated user
export const getCurrentUser = (req: Request) => {
  if (req.isAuthenticated()) {
    return req.user;
  }
  return null;
};
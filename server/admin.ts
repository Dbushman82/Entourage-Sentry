import { Request, Response, Express } from 'express';
import { storage } from './storage';
import { isAdmin } from './middlewares/auth';
import { z } from 'zod';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, insertUserSchema } from '@shared/schema';

const scryptAsync = promisify(scrypt);

// Set up paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Sub-directories
const logosDir = path.join(uploadsDir, 'logos');
const scannersDir = path.join(uploadsDir, 'scanners');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

if (!fs.existsSync(scannersDir)) {
  fs.mkdirSync(scannersDir, { recursive: true });
}

// Configure multer storage
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.path.includes('/branding') ? 'logos' : 'scanners';
    cb(null, path.join(uploadsDir, type));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage2 });

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// User update schema
const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'manager', 'admin']).optional(),
  active: z.boolean().optional(),
});

// Scanner version schema
const scannerVersionSchema = z.object({
  platform: z.enum(['windows', 'mac']),
  version: z.string(),
  uploadedBy: z.number(),
  uploadedAt: z.date(),
  filePath: z.string(),
});

export function setupAdminRoutes(app: Express) {
  // Apply admin middleware to all routes
  app.use('/api/admin', isAdmin);

  // User Management Routes
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: result.error.errors });
      }

      const { password, ...userData } = result.data;
      const hashedPassword = await hashPassword(password);
      
      // Generate username from email if not provided
      const username = userData.email.split('@')[0];

      const user = await storage.createUser({
        ...userData,
        username, // Add username derived from email
        password: hashedPassword,
        role: userData.role || 'user',
        active: true,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userData = { id, ...req.body };
      
      const result = updateUserSchema.safeParse(userData);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: result.error.errors });
      }

      // Hash password if provided
      if (req.body.password) {
        req.body.password = await hashPassword(req.body.password);
      }

      // If email is changed, update username to match new email
      if (req.body.email) {
        req.body.username = req.body.email.split('@')[0];
      }

      const updatedUser = await storage.updateUser(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Branding Routes
  app.post('/api/admin/branding/logo', upload.single('logo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file provided' });
      }

      // Save logo path in database or configuration
      const logoPath = req.file.path;
      const logoUrl = `/uploads/logos/${path.basename(logoPath)}`;

      // Update system settings with logo
      await storage.updateSystemSetting('companyLogo', logoUrl);

      res.json({ 
        message: 'Logo uploaded successfully',
        logoUrl 
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  });

  app.get('/api/admin/branding', async (req: Request, res: Response) => {
    try {
      // Get branding settings from database
      const logoUrl = await storage.getSystemSetting('companyLogo');
      const companyName = await storage.getSystemSetting('companyName');
      const primaryColor = await storage.getSystemSetting('primaryColor');

      res.json({
        logoUrl,
        companyName,
        primaryColor
      });
    } catch (error) {
      console.error('Error fetching branding:', error);
      res.status(500).json({ message: 'Failed to fetch branding settings' });
    }
  });

  // Scanner Management Routes
  app.post('/api/admin/scanners', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No scanner file provided' });
      }

      const platform = req.body.platform;
      if (platform !== 'windows' && platform !== 'mac') {
        return res.status(400).json({ message: 'Invalid platform specified. Must be "windows" or "mac"' });
      }

      // Extract version from filename or generate one based on date
      // For a real app, you'd parse the actual version from the scanner
      const version = `1.${Math.floor(Date.now() / 1000000)}.${Math.floor(Math.random() * 100)}`;
      
      // Create scanner version record
      const newVersion = {
        platform,
        version,
        uploadedBy: req.user!.id,  // Current user ID
        uploadedAt: new Date(),
        filePath: req.file.path
      };

      const scannerVersion = await storage.createScannerVersion(newVersion);

      res.status(201).json({
        id: scannerVersion.id,
        platform,
        version,
        uploadedAt: scannerVersion.uploadedAt,
        uploadedBy: req.user!.id
      });
    } catch (error) {
      console.error('Error uploading scanner:', error);
      res.status(500).json({ message: 'Failed to upload scanner' });
    }
  });

  app.get('/api/admin/scanners', async (req: Request, res: Response) => {
    try {
      const scannerVersions = await storage.getAllScannerVersions();
      res.json(scannerVersions);
    } catch (error) {
      console.error('Error fetching scanner versions:', error);
      res.status(500).json({ message: 'Failed to fetch scanner versions' });
    }
  });

  app.delete('/api/admin/scanners/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get scanner version to delete the file
      const scannerVersion = await storage.getScannerVersion(id);
      if (!scannerVersion) {
        return res.status(404).json({ message: 'Scanner version not found' });
      }

      // Delete the file
      if (scannerVersion.filePath && fs.existsSync(scannerVersion.filePath)) {
        fs.unlinkSync(scannerVersion.filePath);
      }

      // Delete the record
      const success = await storage.deleteScannerVersion(id);
      if (!success) {
        return res.status(404).json({ message: 'Scanner version not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting scanner version:', error);
      res.status(500).json({ message: 'Failed to delete scanner version' });
    }
  });
}
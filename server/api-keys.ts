import { Request, Response } from "express";
import { Express } from "express";
import { PostgresStorage } from "./postgres-storage";
import { insertApiKeySchema } from "@shared/schema";
import { z } from "zod";

// Create a single instance of the storage class
const storage = new PostgresStorage();

export function setupApiKeyRoutes(app: Express) {
  // Get all API keys
  app.get('/api/api-keys', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
      const apiKeys = await storage.getAllApiKeys();
      
      // Never return the actual key values for security reasons in list view
      const safeApiKeys = apiKeys.map(key => ({
        ...key,
        key: '••••••••••••••••' // Masked key for display
      }));
      
      return res.json(safeApiKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({ message: 'Server error while fetching API keys' });
    }
  });

  // Get a specific API key by ID (with actual key value)
  app.get('/api/api-keys/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
      const apiKey = await storage.getApiKey(parseInt(req.params.id));
      if (!apiKey) {
        return res.status(404).json({ message: 'API key not found' });
      }
      
      return res.json(apiKey);
    } catch (error) {
      console.error('Error fetching API key:', error);
      return res.status(500).json({ message: 'Server error while fetching API key' });
    }
  });

  // Create a new API key
  app.post('/api/api-keys', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
      const validatedData = insertApiKeySchema.parse({
        ...req.body,
        createdBy: req.user.id
      });

      const apiKey = await storage.createApiKey(validatedData);
      return res.status(201).json(apiKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      console.error('Error creating API key:', error);
      return res.status(500).json({ message: 'Server error while creating API key' });
    }
  });

  // Update an existing API key
  app.put('/api/api-keys/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
      const id = parseInt(req.params.id);
      const existingKey = await storage.getApiKey(id);
      
      if (!existingKey) {
        return res.status(404).json({ message: 'API key not found' });
      }

      // Use partial validation for update
      const updateData = {
        name: req.body.name,
        key: req.body.key,
        documentationUrl: req.body.documentationUrl
      };

      const apiKey = await storage.updateApiKey(id, updateData);
      return res.json(apiKey);
    } catch (error) {
      console.error('Error updating API key:', error);
      return res.status(500).json({ message: 'Server error while updating API key' });
    }
  });

  // Delete an API key
  app.delete('/api/api-keys/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteApiKey(id);
      
      if (!success) {
        return res.status(404).json({ message: 'API key not found or could not be deleted' });
      }
      
      return res.status(200).json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return res.status(500).json({ message: 'Server error while deleting API key' });
    }
  });
}
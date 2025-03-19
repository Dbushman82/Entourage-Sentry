import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertContactSchema, 
  insertCompanySchema, 
  insertDomainDataSchema, 
  insertServiceSchema,
  insertNetworkAssessmentSchema,
  insertCostSchema,
  insertPainPointSchema,
  insertAssessmentSchema
} from "@shared/schema";
import * as schema from '@shared/schema';
import { db } from './db';
import { z } from "zod";
import { analyzeDomain } from "./utils/domainRecon";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import crypto from 'crypto';
import { setupAuthRoutes } from "./auth";
import { isAuthenticated, isManager, isAdmin } from "./middlewares/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(err).message });
    }
    
    console.error(err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  };

  // Generate a unique reference code for assessments
  const generateReferenceCode = (): string => {
    const prefix = 'ESNT';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  // Assessment APIs
  app.post('/api/assessments', async (req: Request, res: Response) => {
    try {
      // We need at minimum contact and company info to start an assessment
      const contactData = insertContactSchema.parse(req.body.contact);
      const companyData = insertCompanySchema.parse(req.body.company);
      
      // Create contact and company records
      const contact = await storage.createContact(contactData);
      const company = await storage.createCompany(companyData);
      
      // Create the assessment with a unique reference code
      const assessmentData = {
        referenceCode: generateReferenceCode(),
        contactId: contact.id,
        companyId: company.id,
        status: 'in_progress',
        currentStep: 1
      };
      
      const validAssessment = insertAssessmentSchema.parse(assessmentData);
      const assessment = await storage.createAssessment(validAssessment);
      
      res.status(201).json({ assessment, contact, company });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/assessments', async (_req: Request, res: Response) => {
    try {
      const assessments = await storage.getAllAssessments();
      res.json(assessments);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/assessments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      res.json(assessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/assessments/reference/:code', async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      
      const assessment = await storage.getAssessmentByReferenceCode(code);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      res.json(assessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/assessments/:id/details', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const details = await storage.getAssessmentDetails(id);
      if (!details) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      res.json(details);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/assessments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      const updateSchema = insertAssessmentSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedAssessment = await storage.updateAssessment(id, validData);
      res.json(updatedAssessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/assessments/:id/complete', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      const updatedAssessment = await storage.updateAssessment(id, {
        status: 'completed',
        currentStep: 7,
      });
      
      // Also update the completedAt timestamp
      if (updatedAssessment) {
        (updatedAssessment as any).completedAt = new Date();
        await storage.updateAssessment(id, { ...updatedAssessment });
      }
      
      res.json(updatedAssessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/assessments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const deleted = await storage.deleteAssessment(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Contact APIs
  app.post('/api/contacts', async (req: Request, res: Response) => {
    try {
      const validData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validData);
      res.status(201).json(contact);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid contact ID' });
      }
      
      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      const updateSchema = insertContactSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedContact = await storage.updateContact(id, validData);
      res.json(updatedContact);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Company APIs
  app.post('/api/companies', async (req: Request, res: Response) => {
    try {
      const validData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validData);
      res.status(201).json(company);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.get('/api/companies', async (_req: Request, res: Response) => {
    try {
      const companies = await db.select().from(schema.companies);
      res.json(companies);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  app.put('/api/companies/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      const updateSchema = insertCompanySchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedCompany = await storage.updateCompany(id, validData);
      res.json(updatedCompany);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Domain data APIs
  app.post('/api/domain', async (req: Request, res: Response) => {
    try {
      const { domain, companyId } = req.body;
      if (!domain) {
        return res.status(400).json({ message: 'Domain is required' });
      }
      
      // Get domain information
      const domainInfo = await analyzeDomain(domain);
      
      // If companyId is provided, store the domain data
      if (companyId) {
        const companyIdNum = parseInt(companyId);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({ message: 'Invalid company ID' });
        }
        
        const company = await storage.getCompany(companyIdNum);
        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }
        
        const domainDataToStore = {
          companyId: companyIdNum,
          domain,
          ...domainInfo
        };
        
        const validDomainData = insertDomainDataSchema.parse(domainDataToStore);
        const savedDomainData = await storage.createDomainData(validDomainData);
        
        // Update the assessment with the domain data ID
        const assessments = await storage.getAllAssessments();
        const assessment = assessments.find(a => a.companyId === companyIdNum);
        if (assessment) {
          await storage.updateAssessment(assessment.id, {
            domainDataId: savedDomainData.id
          });
        }
        
        return res.json(savedDomainData);
      }
      
      // Otherwise just return the domain info without storing
      res.json(domainInfo);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Service APIs
  app.post('/api/services', async (req: Request, res: Response) => {
    try {
      const validData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validData);
      res.status(201).json(service);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/services/company/:companyId', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const services = await storage.getServicesByCompanyId(companyId);
      res.json(services);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/services/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid service ID' });
      }
      
      const updateSchema = insertServiceSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedService = await storage.updateService(id, validData);
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(updatedService);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/services/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid service ID' });
      }
      
      const deleted = await storage.deleteService(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Network assessment APIs
  app.post('/api/network-assessments', async (req: Request, res: Response) => {
    try {
      const validData = insertNetworkAssessmentSchema.parse(req.body);
      const assessment = await storage.createNetworkAssessment(validData);
      
      // Update the assessment with the network assessment ID
      const assessments = await storage.getAllAssessments();
      const mainAssessment = assessments.find(a => a.companyId === validData.companyId);
      if (mainAssessment) {
        await storage.updateAssessment(mainAssessment.id, {
          networkAssessmentId: assessment.id
        });
      }
      
      res.status(201).json(assessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/network-assessments/company/:companyId', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const assessment = await storage.getNetworkAssessmentByCompanyId(companyId);
      if (!assessment) {
        return res.status(404).json({ message: 'Network assessment not found for this company' });
      }
      
      res.json(assessment);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Cost APIs
  app.post('/api/costs', async (req: Request, res: Response) => {
    try {
      const validData = insertCostSchema.parse(req.body);
      const cost = await storage.createCost(validData);
      res.status(201).json(cost);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/costs/company/:companyId', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const costs = await storage.getCostsByCompanyId(companyId);
      res.json(costs);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/costs/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid cost ID' });
      }
      
      const updateSchema = insertCostSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedCost = await storage.updateCost(id, validData);
      if (!updatedCost) {
        return res.status(404).json({ message: 'Cost not found' });
      }
      
      res.json(updatedCost);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/costs/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid cost ID' });
      }
      
      const deleted = await storage.deleteCost(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Cost not found' });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Pain points APIs
  app.post('/api/pain-points', async (req: Request, res: Response) => {
    try {
      const validData = insertPainPointSchema.parse(req.body);
      const painPoint = await storage.createPainPoint(validData);
      
      // Update the assessment with the pain point ID
      const assessments = await storage.getAllAssessments();
      const assessment = assessments.find(a => a.companyId === validData.companyId);
      if (assessment) {
        await storage.updateAssessment(assessment.id, {
          painPointId: painPoint.id
        });
      }
      
      res.status(201).json(painPoint);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/pain-points/company/:companyId', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const painPoint = await storage.getPainPointByCompanyId(companyId);
      if (!painPoint) {
        return res.status(404).json({ message: 'Pain points not found for this company' });
      }
      
      res.json(painPoint);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/pain-points/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid pain point ID' });
      }
      
      const updateSchema = insertPainPointSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedPainPoint = await storage.updatePainPoint(id, validData);
      if (!updatedPainPoint) {
        return res.status(404).json({ message: 'Pain point not found' });
      }
      
      res.json(updatedPainPoint);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Network scanner download routes
  app.get('/api/scanner/:platform', (req: Request, res: Response) => {
    const { platform } = req.params;
    
    if (platform !== 'windows' && platform !== 'mac') {
      return res.status(400).json({ message: 'Invalid platform specified' });
    }
    
    const platformName = platform === 'windows' ? 'Windows' : 'macOS';
    const version = platform === 'windows' ? '1.2.3' : '1.2.1';
    
    // Create a simple HTML page that explains this is a demo
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EntourageSentryScanner Download</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .box {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .header {
            color: #0066cc;
            margin-top: 0;
          }
          .button {
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .note {
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>EntourageSentryScanner for ${platformName}</h1>
        <div class="box">
          <h2 class="header">Download Information</h2>
          <p>You're downloading EntourageSentryScanner version ${version} for ${platformName}.</p>
          <p>This is a demo page. In a production environment, this would initiate the actual scanner download.</p>
          <p>After downloading, please extract the zip file and run the executable with administrator privileges.</p>
          <p><a href="javascript:window.close()" class="button">Close this window</a></p>
        </div>
        <p class="note">© 2025 Entourage IT - Enterprise Network Security Scanner</p>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Setup authentication routes
  setupAuthRoutes(app);
  
  // Apply authentication middleware to protected routes
  // You can uncomment these lines to secure specific routes
  
  /*
  // Require authentication for all assessment management routes
  app.get('/api/assessments', isAuthenticated, async (_req: Request, res: Response) => {
    // ...existing code
  });
  
  // Manager-only routes
  app.delete('/api/assessments/:id', isManager, async (req: Request, res: Response) => {
    // ...existing code
  });
  
  // Admin-only routes
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    // Admin-only functionality
  });
  */
  
  const httpServer = createServer(app);
  return httpServer;
}

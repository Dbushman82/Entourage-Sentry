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
  insertExpenseSchema,
  insertPainPointSchema,
  insertAssessmentSchema,
  insertAssessmentRequestSchema,
  insertCustomQuestionSchema,
  insertCustomQuestionResponseSchema,
  insertIndustrySchema
} from "@shared/schema";
import * as schema from '@shared/schema';
import { User } from '@shared/schema';
import { db } from './db';
import { z } from "zod";
import { analyzeDomain } from "./utils/domainRecon";
import { enrichCompanyByDomain, enrichCompanyByName } from "./utils/pdlEnrichment";
import { companyEnrichmentService } from "./services/company-enrichment";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import crypto from 'crypto';
import { setupAuthRoutes } from "./auth";
import { setupAdminRoutes } from "./admin";
import { setupApiKeyRoutes } from "./api-keys";
import { isAuthenticated, isManager, isAdmin } from "./middlewares/auth";
import { scrapeCompanyInfo } from "./services/scraper";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: fromZodError(err).message });
    }
    
    console.error(err);
    
    // Check for database/connection errors
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (
      errorMsg.includes("terminating connection") || 
      errorMsg.includes("database") || 
      errorMsg.includes("connection") ||
      errorMsg.includes("PostgresError")
    ) {
      return res.status(500).json({ 
        message: "Database connection error. Please try refreshing the page.", 
        dbError: true
      });
    }
    
    return res.status(500).json({ message: errorMsg || 'Internal server error' });
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
      // Use extend to allow the companyWebsite field in the contact data
      const extendedContactSchema = insertContactSchema.extend({
        companyWebsite: z.string().optional(),
        firstName: z.string().optional().default(""),
        lastName: z.string().optional().default(""),
        email: z.string().optional().default(""),
      });
      
      const contactData = extendedContactSchema.parse(req.body.contact);
      const companyData = insertCompanySchema.parse(req.body.company);
      
      // Create contact with empty values for new assessments
      const contact = await storage.createContact({
        ...contactData,
        firstName: contactData.firstName || "",
        lastName: contactData.lastName || "",
        email: contactData.email || "",
      });
      
      // Create company record
      const company = await storage.createCompany(companyData);
      
      // Create the assessment with a unique reference code
      const assessmentData = {
        referenceCode: generateReferenceCode(),
        contactId: contact.id,
        companyId: company.id,
        status: 'draft',
        currentStep: 1
      };
      
      const validAssessment = insertAssessmentSchema.parse(assessmentData);
      const assessment = await storage.createAssessment(validAssessment);
      
      // Generate a link for the assessment automatically
      const link = await storage.generateAssessmentLink(assessment.id, '7d');
      
      res.status(201).json({ assessment, contact, company, link });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/assessments', async (_req: Request, res: Response) => {
    try {
      const assessments = await storage.getAllAssessments();
      
      // Get company information for each assessment with more robust error handling
      const assessmentsWithCompanyInfo = await Promise.all(
        assessments.map(async (assessment) => {
          try {
            const company = await storage.getCompany(assessment.companyId);
            return {
              ...assessment,
              companyName: company?.name || 'Unknown Company'
            };
          } catch (companyErr) {
            console.error(`Error fetching company for assessment ${assessment.id}:`, companyErr);
            // Continue with partial data rather than failing the entire request
            return {
              ...assessment,
              companyName: 'Unknown Company'
            };
          }
        })
      );
      
      res.json(assessmentsWithCompanyInfo);
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
      
      // Ensure contact.companyWebsite is populated from company.website if missing
      if (details.contact && !details.contact.companyWebsite && details.company && details.company.website) {
        details.contact.companyWebsite = details.company.website;
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
  
  // Generate a signed link for an assessment
  app.post('/api/assessments/:id/link', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const { expirationDuration = '7d' } = req.body;
      
      // Validate expiration duration format (e.g., '1d', '7d', '30d', '24h')
      const durationPattern = /^(\d+)([dhm])$/;
      if (!durationPattern.test(expirationDuration)) {
        return res.status(400).json({ 
          message: 'Invalid expiration duration format. Use format like "7d", "24h", or "60m".' 
        });
      }
      
      const result = await storage.generateAssessmentLink(id, expirationDuration);
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Renew a signed link for an assessment
  app.post('/api/assessments/:id/link/renew', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const { expirationDuration = '7d' } = req.body;
      
      // Validate expiration duration format
      const durationPattern = /^(\d+)([dhm])$/;
      if (!durationPattern.test(expirationDuration)) {
        return res.status(400).json({ 
          message: 'Invalid expiration duration format. Use format like "7d", "24h", or "60m".' 
        });
      }
      
      const result = await storage.renewAssessmentLink(id, expirationDuration);
      res.json(result);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Verify assessment token
  app.get('/api/assessments/verify-token/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const assessment = await storage.verifyAssessmentLink(token);
      
      if (!assessment) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      res.json({ valid: true, assessmentId: assessment.id, referenceCode: assessment.referenceCode });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Record NDA acceptance for an assessment
  app.post('/api/assessments/nda-acceptance', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        assessmentId: z.number(),
        acceptedAt: z.string().datetime(),
        ipAddress: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      
      // First, update the assessment record to flag NDA acceptance
      const assessment = await storage.getAssessment(data.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Update the assessment with NDA acceptance info
      await storage.updateAssessment(data.assessmentId, {
        ndaAccepted: true,
        ndaAcceptedAt: new Date(data.acceptedAt)
      });
      
      // Log additional details to a dedicated NDA logs table if needed
      // This could be implemented in postgres-storage.ts as a new method
      
      res.status(200).json({ message: "NDA acceptance recorded successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Duplicate an assessment
  app.post('/api/assessments/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      // Get the assessment details including all related data
      const details = await storage.getAssessmentDetails(id);
      if (!details) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      // Create a new contact based on the original
      // Note: Extended schema in the route already handles companyWebsite
      const contactData = {
        firstName: details.contact?.firstName || "",
        lastName: details.contact?.lastName || "",
        email: details.contact?.email || "",
        phone: details.contact?.phone || null
      };
      
      // We'll add companyWebsite to the request body since our extendedContactSchema supports it
      const reqBody = {
        ...contactData,
        companyWebsite: details.contact?.companyWebsite || null
      };
      
      const extendedContactSchema = insertContactSchema.extend({
        companyWebsite: z.string().nullable().optional(),
      });
      
      const validContactData = extendedContactSchema.parse(reqBody);
      const contact = await storage.createContact(contactData);
      
      // Create a new company based on the original
      const company = await storage.createCompany({
        name: details.company?.name || "",
        website: details.company?.website || "",
        address: details.company?.address || null,
        phone: details.company?.phone || null,
        primaryContact: details.company?.primaryContact || null
      });
      
      // Create the new assessment with a unique reference code and reset status
      const assessmentData = {
        referenceCode: generateReferenceCode(),
        contactId: contact.id,
        companyId: company.id,
        status: 'draft',
        currentStep: 1
      };
      
      const validAssessment = insertAssessmentSchema.parse(assessmentData);
      const assessment = await storage.createAssessment(validAssessment);
      
      // Generate a link for the new assessment
      const link = await storage.generateAssessmentLink(assessment.id, '7d');
      
      // If the original assessment had company profile data, create it for the new one
      if (details.companyProfile) {
        // Copy company profile data if needed
        // This would be implemented in a real system
      }
      
      // Copy other related data as needed (services, costs, etc.)
      // This would be more comprehensive in a complete implementation
      
      res.status(201).json({ 
        assessment, 
        contact, 
        company, 
        link,
        message: 'Assessment duplicated successfully' 
      });
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
      
      const extendedContactSchema = insertContactSchema.extend({
        companyWebsite: z.string().optional(),
      });
      const updateSchema = extendedContactSchema.partial();
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
  
  // Scrape company information from website domain
  app.post('/api/companies/scrape-domain', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        domain: z.string().min(3, "Domain must be at least 3 characters long")
      });
      
      const { domain } = schema.parse(req.body);
      console.log(`Scraping company information for domain: ${domain}`);
      
      // Perform the scraping
      const companyInfo = await scrapeCompanyInfo(domain);
      
      if (Object.keys(companyInfo).length === 0) {
        return res.status(404).json({ 
          message: 'Could not extract information from this domain. Please enter company details manually.'
        });
      }
      
      res.status(200).json({
        success: true,
        data: companyInfo
      });
    } catch (err) {
      console.error('Error in domain scraping:', err);
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
      
      // Log company update - helpful for debugging address updates
      console.log('Updating company with data:', validData);
      
      // Update company record with new info
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

  // Expenses APIs
  app.post('/api/expenses', async (req: Request, res: Response) => {
    try {
      const validData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validData);
      res.status(201).json(expense);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/expenses/company/:companyId', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const expenses = await storage.getExpensesByCompanyId(companyId);
      res.json(expenses);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/expenses/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid expense ID' });
      }
      
      const updateSchema = insertExpenseSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedExpense = await storage.updateExpense(id, validData);
      if (!updatedExpense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      res.json(updatedExpense);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/expenses/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid expense ID' });
      }
      
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Expense not found' });
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

  // Company Enrichment APIs
  app.post('/api/companies/enrich/domain', async (req: Request, res: Response) => {
    try {
      const { domain, companyId } = req.body;
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }
      
      console.log('[Enrichment] Starting company enrichment for domain:', domain);
      
      // First, analyze the domain for technical details
      const domainReconData = await analyzeDomain(domain);
      console.log('[Enrichment] Domain analysis complete for', domain);
      
      // Normalize domain for API calls
      const normalizedDomain = domain.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      console.log('[Enrichment] Using normalized domain:', normalizedDomain);
      
      // Use the new company enrichment service that tries multiple providers
      // This will first attempt AbstractAPI and fall back to PDL if needed
      const enrichedData = await companyEnrichmentService.enrichCompanyByDomain(normalizedDomain);
      
      // Get PDL enrichment data for backward compatibility and domain tech analysis
      const pdlEnrichmentData = await enrichCompanyByDomain(normalizedDomain);
      
      console.log('[Enrichment] Result:', enrichedData ? 'Success' : 'Failed');
      
      if (enrichedData) {
        console.log('[Enrichment] Received data:', JSON.stringify({
          name: enrichedData.name,
          industry: enrichedData.industry,
          employeeCount: enrichedData.employeeCount,
          yearFounded: enrichedData.yearFounded,
          phone: enrichedData.phone,
          address: enrichedData.streetAddress ? {
            street: enrichedData.streetAddress,
            city: enrichedData.city,
            state: enrichedData.state,
            postalCode: enrichedData.postalCode
          } : 'Not available'
        }, null, 2));
      }
      
      // Prepare the complete response object
      let responseData: any = {
        domain,
        domainData: domainReconData,
        enrichment: {
          // For backward compatibility, maintain the PDL enrichment format while adding our new data
          ...pdlEnrichmentData,
          // Add the enriched data we got from either AbstractAPI or PDL
          enrichedData
        }
      };
      
      // If companyId is provided, update the company with the enriched data
      if (companyId && enrichedData) {
        const companyIdNum = parseInt(companyId);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({ error: 'Invalid company ID' });
        }
        
        const company = await storage.getCompany(companyIdNum);
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        // Update the company with enriched data
        const enrichedCompanyData: any = {
          logo: enrichedData.logo,
          industry: enrichedData.industry || company.industry,
          employeeCount: enrichedData.employeeCount?.toString() || company.employeeCount,
          founded: enrichedData.yearFounded?.toString(),
          // New fields from AbstractAPI
          phone: enrichedData.phone || company.phone,
          
          // Store both in legacy address field (for backward compatibility) and in new detailed fields
          address: enrichedData.streetAddress ? 
            `${enrichedData.streetAddress}${enrichedData.city ? ', ' + enrichedData.city : ''}${enrichedData.state ? ', ' + enrichedData.state : ''}${enrichedData.postalCode ? ' ' + enrichedData.postalCode : ''}` 
            : company.address,
          
          // Store in new detailed fields
          streetAddress: enrichedData.streetAddress || company.streetAddress,
          city: enrichedData.city || company.city,
          state: enrichedData.state || company.state,
          postalCode: enrichedData.postalCode || company.postalCode,
          country: enrichedData.country || company.country,
          
          enrichedAt: new Date().toISOString()
        };
        
        // Get additional data from PDL if available
        if (pdlEnrichmentData.success && pdlEnrichmentData.data) {
          enrichedCompanyData.description = pdlEnrichmentData.data.description || enrichedCompanyData.description;
          enrichedCompanyData.companyType = pdlEnrichmentData.data.companyType || enrichedCompanyData.companyType;
          enrichedCompanyData.annualRevenue = pdlEnrichmentData.data.annualRevenue || enrichedCompanyData.annualRevenue;
          
          if (pdlEnrichmentData.data.socialProfiles) {
            enrichedCompanyData.socialProfiles = JSON.stringify(pdlEnrichmentData.data.socialProfiles);
          }
          
          if (pdlEnrichmentData.data.tags) {
            enrichedCompanyData.tags = JSON.stringify(pdlEnrichmentData.data.tags);
          }
        }
        
        // Remove undefined/null properties
        Object.keys(enrichedCompanyData).forEach(key => {
          if (enrichedCompanyData[key] === undefined || enrichedCompanyData[key] === null) {
            delete enrichedCompanyData[key];
          }
        });
        
        if (Object.keys(enrichedCompanyData).length > 0) {
          const updatedCompany = await storage.updateCompany(companyIdNum, enrichedCompanyData);
          // Add updated company to response data if available
          responseData = {
            ...responseData,
            updatedCompany
          };
        }
      }
      
      // Return the complete response with all data
      res.json(responseData);
    } catch (error) {
      console.error('[Enrichment] Error in domain enrichment:', error);
      handleError(error, res);
    }
  });
  
  app.post('/api/companies/enrich/name', async (req: Request, res: Response) => {
    try {
      const { name, location, companyId } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Company name is required' });
      }

      // Get enrichment data from PDL API
      const enrichmentData = await enrichCompanyByName(name, location);
      
      // If companyId is provided, update the company with the enriched data
      if (companyId && enrichmentData.success && enrichmentData.data) {
        const companyIdNum = parseInt(companyId);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({ message: 'Invalid company ID' });
        }
        
        const company = await storage.getCompany(companyIdNum);
        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }
        
        // Update the company with enriched data
        const enrichedCompanyData: any = {
          logo: enrichmentData.data.logo,
          description: enrichmentData.data.description,
          industry: enrichmentData.data.industry || company.industry,
          employeeCount: enrichmentData.data.employeeCount?.toString() || company.employeeCount,
          founded: enrichmentData.data.founded,
          companyType: enrichmentData.data.companyType,
          annualRevenue: enrichmentData.data.annualRevenue,
          
          // Store address components if available
          streetAddress: enrichmentData.data.streetAddress || company.streetAddress,
          city: enrichmentData.data.city || company.city,
          state: enrichmentData.data.state || company.state,
          postalCode: enrichmentData.data.postalCode || company.postalCode,
          country: enrichmentData.data.country || company.country,
          
          // For backward compatibility, maintain the full address string
          address: enrichmentData.data.streetAddress ? 
            `${enrichmentData.data.streetAddress}${enrichmentData.data.city ? ', ' + enrichmentData.data.city : ''}${enrichmentData.data.state ? ', ' + enrichmentData.data.state : ''}${enrichmentData.data.postalCode ? ' ' + enrichmentData.data.postalCode : ''}` 
            : company.address,
            
          socialProfiles: enrichmentData.data.socialProfiles ? JSON.stringify(enrichmentData.data.socialProfiles) : null,
          tags: enrichmentData.data.tags ? JSON.stringify(enrichmentData.data.tags) : null,
          enrichedAt: new Date().toISOString()
        };
        
        // Remove undefined/null properties
        Object.keys(enrichedCompanyData).forEach(key => {
          if (enrichedCompanyData[key] === undefined || enrichedCompanyData[key] === null) {
            delete enrichedCompanyData[key];
          }
        });
        
        if (Object.keys(enrichedCompanyData).length > 0) {
          const updatedCompany = await storage.updateCompany(companyIdNum, enrichedCompanyData);
          
          // Return the enrichment data and updated company
          return res.json({
            enrichment: enrichmentData,
            company: updatedCompany
          });
        }
      }
      
      // If no companyId or no updates needed, just return the enrichment data
      res.json({ enrichment: enrichmentData });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Security assessment endpoint
  app.post('/api/companies/security/domain', async (req: Request, res: Response) => {
    try {
      const { domain, companyId } = req.body;
      
      if (!domain) {
        return res.status(400).json({
          success: false,
          error: 'Domain is required'
        });
      }
      
      // Import the security analysis utility
      const { fetchSecurityData } = await import('./utils/securityAnalysis');
      
      // Step 1: Fetch security data from the API
      const securityData = await fetchSecurityData(domain);
      
      // Step 2: Store in the database if company ID is provided
      let securityAssessment = null;
      
      if (companyId && securityData && !securityData.error) {
        const companyIdNum = parseInt(companyId);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({ message: 'Invalid company ID' });
        }
        
        const company = await storage.getCompany(companyIdNum);
        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }
        
        // Prepare the data for insertion
        const securityAssessmentData: schema.InsertSecurityAssessment = {
          companyId: companyIdNum,
          domain: securityData.domain,
          securityScore: securityData.securityScore,
          technologies: securityData.technologies || [],
          exposedServices: securityData.exposedServices || [],
          vulnerabilitiesHigh: securityData.vulnerabilities?.high || 0,
          vulnerabilitiesMedium: securityData.vulnerabilities?.medium || 0,
          vulnerabilitiesLow: securityData.vulnerabilities?.low || 0,
          vulnerabilitiesInfo: securityData.vulnerabilities?.info || 0,
          presentSecurityHeaders: securityData.securityHeaders?.present || [],
          missingSecurityHeaders: securityData.securityHeaders?.missing || [],
          subdomains: securityData.subdomains || [],
          recommendations: securityData.recommendations || [],
          rawData: securityData
        };
        
        // Create the security assessment in the database
        const storageImplementation = storage as any; // temporary type cast to fix TypeScript error
        securityAssessment = await storageImplementation.createSecurityAssessment(securityAssessmentData);
        
        // If an active assessment exists, link it to the security assessment
        if (securityAssessment) {
          // Find in-progress assessments for this company
          const inProgressAssessments = await storage.getAllAssessments().then(
            assessments => assessments.filter(a => 
              a.companyId === companyIdNum && 
              a.status === 'in_progress'
            )
          );
            
          if (inProgressAssessments.length > 0) {
            await storage.updateAssessment(inProgressAssessments[0].id, {
              securityAssessmentId: securityAssessment.id
            });
          }
        }
      }
      
      // Step 3: Return the combined data
      res.json({
        success: !securityData.error,
        error: securityData.error,
        data: securityData,
        securityAssessmentId: securityAssessment?.id
      });
    } catch (error) {
      console.error('Error processing security assessment:', error);
      handleError(error, res);
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
    const filename = `EntourageSentryScanner_${platform}_v${version}.zip`;
    
    // Create a simple HTML page that provides information and starts the download
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
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
          .progress {
            margin-top: 20px;
            display: none;
          }
          .progress-bar {
            height: 10px;
            background-color: #f3f3f3;
            border-radius: 5px;
            margin-top: 10px;
            overflow: hidden;
          }
          .progress-bar-fill {
            height: 100%;
            background-color: #0066cc;
            border-radius: 5px;
            width: 0%;
            transition: width 0.5s ease;
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
          <p>After downloading, please extract the zip file and run the scanner with administrator privileges.</p>
          <div class="progress">
            <p>Your download should start automatically. If it doesn't, <a href="/api/scanner/${platform}/download" class="button">click here</a>.</p>
            <div class="progress-bar">
              <div class="progress-bar-fill" id="progress"></div>
            </div>
          </div>
          <p><a href="javascript:window.close()" class="button">Close this window</a></p>
        </div>
        <p class="note">© 2025 Entourage IT - Enterprise Network Security Scanner</p>
        
        <script>
          // This script will trigger the download automatically and show a progress animation
          window.onload = function() {
            // Show progress bar
            document.querySelector('.progress').style.display = 'block';
            
            // Animate progress bar
            let progress = 0;
            const interval = setInterval(() => {
              progress += 5;
              document.getElementById('progress').style.width = progress + '%';
              if (progress >= 100) {
                clearInterval(interval);
              }
            }, 50);
            
            // Start download after a brief delay
            setTimeout(function() {
              window.location.href = "/api/scanner/${platform}/download";
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
  
  // Actual download endpoint that will send a real file
  app.get('/api/scanner/:platform/download', (req: Request, res: Response) => {
    const { platform } = req.params;
    
    if (platform !== 'windows' && platform !== 'mac') {
      return res.status(400).json({ message: 'Invalid platform specified' });
    }
    
    const platformName = platform === 'windows' ? 'Windows' : 'macOS';
    const version = platform === 'windows' ? '1.2.3' : '1.2.1';
    const filename = `EntourageSentryScanner_${platform}_v${version}.zip`;
    
    // These are valid ZIP files containing a readme.txt file with installation instructions
    const windowsZipBase64 = 'UEsDBBQAAAAIAEEqc1r4UvTxywEAAMUCAAAKABwAUkVBRE1FLnR4dFVUCQADilPaZwBQ2md1eAsAAQToAwAABOgDAAB9UduO0kAYvp+n+LJXkNiRFlBDYiJuiiEuBdviZr2bLT8w0s6QmQGWR/I1fDL/suIhJs7V/OfvkGblfJmPP6Qo0qzMH5Cl5f08/4jidpxlaS7e/veJz+S8tgaxTGQfa+twr83KnrwQ06wox3d343I6z9AG+fK2/RcjEUukT8GpKkDVNda6Jo+1sw3CVnt8mS6gXLXVRxKJRK432xBVta524FOpCfbg1IYKMsGdi0oZQ07SE0GZFTzVxHtv8oOB8lCrRhvt+Viw7kb0JSa2ru2JLxFvi3zliAy04ZZDFZiLR7DwvBVnvgND4WTdTgwkCnWky9yl6sgf6uAv6NGRXz1jY/7yqam7Yiix3NdWrf7t1+aS+0UDzzxwokfsrQuqFqJ4KMp0hjz9tJzm6YytYdWiq7aIey/jGJ1Xg+hRhy4XJNuGiVMNtVgxkK9l0oLZsnTkuGH8pwzYO31k1BvyXEp6vdl7Vp8IK+138HtVEUNYLhbzvByJCQ8o73lYmYpeoLImtM79JjAt4Q/7FjtUGIm0UboeXVPv6Nqng6xsIxZba2iEzpter4vhcBjFSX8gxPdvjCQZ/r02akNyjNcTsmcnWK/q4HQ446f14gdQSwECHgMUAAAACABBKnNa+FL08csBAADFAgAACgAYAAAAAAABAAAApIEAAAAAUkVBRE1FLnR4dFVUBQADilPaZ3V4CwABBOgDAAAE6AMAAFBLBQYAAAAAAQABAFAAAAAPAgAAAAA=';
    const macZipBase64 = 'UEsDBBQAAAAIAEEqc1qk3X8/xAEAALQCAAAOABwAUkVBRE1FX01BQy50eHRVVAkAA4pT2md0U9pndXgLAAEE6AMAAAToAwAAfZHBbtswDIbvegoeW2AR4qQBhgAD5hbqYKyxM8vZ0N1UmUm0yJIhyUn7SHuNPdnoZN0wDJhOEin+/PhTlE21qfMPAqQom/oRStF8qeqPIO/yshQ1e/ffwz5jiMY7yPiMZ7D1ATqlK8lYUcomf3jIm6IqYXzUm7vxLpcs4yCeU1A6gbIWtsZihG3wHaS9ifC1WIMKem+OyGYcqh4dJRDwUoMttbEtBlCuhdYPTxYn2hp9AOIQLvkhqB1KdCm8SK2cw8BV37M5h3tvrT+d1bybRB2QtI2LKQw60RgRkodINfBCKuAwnXw4sBsOUh3xXHfOBoyDTfGMDlf8W6TONDp/7uw1W3DY9Nar9t//5jLJb0i4UMIJn6D3ISnLmHyUjVhBLT5tilqsaCtk2eRiK2QZ3JodSIKjfnuz22OgZOES2jGS9z0RSUN2eEeJvO2oZx/MkUh3GCk0n05Xt2Q3IrQmHiD2SiO13azXVd0s2T3JqBhNTMppfAMklMZV/YEuGohDP/KCSksmOmXs8jX0Hl//mcS179h67x0u4ertdHoNi8Viks3mN4z9+A6z6Wzxt+xkfGIg3ohQXtwnj/QQTHqBX8tkPwFQSwECHgMUAAAACABBKnNapN1/P8QBAAC0AgAADgAYAAAAAAABAAAApIEAAAAAUkVBRE1FX01BQy50eHRVVAUAA4pT2md1eAsAAQToAwAABOgDAABQSwUGAAAAAAEAAQBUAAAADAIAAAAA';
    
    // Choose the appropriate ZIP file
    const zipBase64 = platform === 'windows' ? windowsZipBase64 : macZipBase64;
    
    // Convert base64 to binary buffer
    const zipBuffer = Buffer.from(zipBase64, 'base64');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', zipBuffer.length);
    
    // Send the file
    res.send(zipBuffer);
  });

  // Setup authentication routes
  setupAuthRoutes(app);
  // Industry management APIs
  app.post('/api/industries', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get the user ID from the authenticated user
      const user = req.user as User;
      
      // Add the current user as the creator
      const validData = insertIndustrySchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const industry = await storage.createIndustry(validData);
      res.status(201).json(industry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/industries', async (req: Request, res: Response) => {
    try {
      const industries = await storage.getAllIndustries();
      res.json(industries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/industries/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid industry ID' });
      }
      
      const industry = await storage.getIndustry(id);
      if (!industry) {
        return res.status(404).json({ message: 'Industry not found' });
      }
      
      res.json(industry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/industries/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid industry ID' });
      }
      
      const industry = await storage.getIndustry(id);
      if (!industry) {
        return res.status(404).json({ message: 'Industry not found' });
      }
      
      const updateSchema = insertIndustrySchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedIndustry = await storage.updateIndustry(id, validData);
      res.json(updatedIndustry);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/industries/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid industry ID' });
      }
      
      const deleted = await storage.deleteIndustry(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Industry not found' });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Question-Industry relationship APIs
  app.post('/api/questions/:questionId/industries/:industryId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const industryId = parseInt(req.params.industryId);
      
      if (isNaN(questionId) || isNaN(industryId)) {
        return res.status(400).json({ message: 'Invalid question or industry ID' });
      }
      
      const question = await storage.getCustomQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const industry = await storage.getIndustry(industryId);
      if (!industry) {
        return res.status(404).json({ message: 'Industry not found' });
      }
      
      await storage.addQuestionIndustry(questionId, industryId);
      res.status(201).json({ questionId, industryId });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/questions/:questionId/industries/:industryId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const industryId = parseInt(req.params.industryId);
      
      if (isNaN(questionId) || isNaN(industryId)) {
        return res.status(400).json({ message: 'Invalid question or industry ID' });
      }
      
      await storage.removeQuestionIndustry(questionId, industryId);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/questions/:questionId/industries', async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const industries = await storage.getIndustriesByQuestionId(questionId);
      res.json(industries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/industries/:industryId/questions', async (req: Request, res: Response) => {
    try {
      const industryId = parseInt(req.params.industryId);
      
      if (isNaN(industryId)) {
        return res.status(400).json({ message: 'Invalid industry ID' });
      }
      
      const questions = await storage.getQuestionsByIndustryId(industryId);
      res.json(questions);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Custom question APIs with industry categories support
  app.post('/api/questions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get the user ID from the authenticated user
      const user = req.user as User;
      
      // Add the current user as the creator
      const validData = insertCustomQuestionSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      const question = await storage.createCustomQuestion(validData);
      
      // If this is an industry question, add the industry relationships
      if (validData.category === 'industry' && validData.industryIds) {
        // Process industry IDs, ensuring they're numbers
        let industryIdsToAdd: number[] = [];
        
        if (Array.isArray(validData.industryIds)) {
          industryIdsToAdd = validData.industryIds.map(id => {
            if (typeof id === 'string') {
              return parseInt(id);
            } else if (typeof id === 'number') {
              return id;
            } else {
              console.warn(`Unexpected type for industry ID: ${typeof id}, value: ${id}`);
              return NaN; // This will be filtered out below
            }
          });
        } else if (typeof validData.industryIds === 'string') {
          industryIdsToAdd = [parseInt(validData.industryIds)];
        } else if (typeof validData.industryIds === 'number') {
          industryIdsToAdd = [validData.industryIds];
        }
        
        // Remove invalid IDs (NaN)
        industryIdsToAdd = industryIdsToAdd.filter(id => !isNaN(id));
        
        console.log(`Adding industry associations for new question ${question.id}:`, industryIdsToAdd);
        
        // Add industry associations
        for (const industryId of industryIdsToAdd) {
          await storage.addQuestionIndustry(question.id, industryId);
        }
      }
      
      // Get the industries for the question to include in the response
      const industries = await storage.getIndustriesByQuestionId(question.id);
      
      res.status(201).json({
        ...question,
        industries: industries
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/questions/assessment/:assessmentId', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      const questions = await storage.getCustomQuestionsByAssessmentId(assessmentId);
      
      // For each question, add its associated industries
      const questionsWithIndustries = await Promise.all(
        questions.map(async (question) => {
          const industries = await storage.getIndustriesByQuestionId(question.id);
          return {
            ...question,
            industries
          };
        })
      );
      
      res.json(questionsWithIndustries);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get global custom questions
  app.get('/api/questions/global', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getGlobalQuestions();
      res.json(questions);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get industry-specific questions
  app.get('/api/questions/industry', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getIndustryQuestions();
      
      // For each question, add its associated industries
      const questionsWithIndustries = await Promise.all(
        questions.map(async (question) => {
          const industries = await storage.getIndustriesByQuestionId(question.id);
          return {
            ...question,
            industries
          };
        })
      );
      
      res.json(questionsWithIndustries);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get ALL questions (global and industry-specific)
  app.get('/api/questions', async (req: Request, res: Response) => {
    try {
      // Combine global and industry questions
      const globalQuestions = await storage.getGlobalQuestions();
      const industryQuestions = await storage.getIndustryQuestions();
      
      // Merge and add industry associations to each question
      const allQuestions = [...globalQuestions, ...industryQuestions];
      
      const questionsWithIndustries = await Promise.all(
        allQuestions.map(async (question) => {
          // Only fetch industries for industry-specific questions
          if (question.category === 'industry') {
            const industries = await storage.getIndustriesByQuestionId(question.id);
            
            // Log the industries being returned for debugging
            console.log(`Question ID ${question.id} (${question.question}) industries:`, industries);
            
            return {
              ...question,
              industries: industries.map(i => String(i.id)) // Convert to string array of IDs for frontend
            };
          }
          return {
            ...question,
            industries: [] // Empty array for global questions
          };
        })
      );
      
      // Debug output
      console.log('Returning questions with industries:', 
                 questionsWithIndustries.map(q => ({ 
                   id: q.id, 
                   question: q.question, 
                   category: q.category, 
                   industries: q.industries 
                 })));
      
      res.json(questionsWithIndustries);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get all questions for an assessment (including global ones and industry-specific ones)
  app.get('/api/assessments/:assessmentId/questions', async (req: Request, res: Response) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: 'Invalid assessment ID' });
      }
      
      // Use our updated storage method that handles all categories
      const questions = await storage.getCustomQuestionsByAssessmentId(assessmentId);
      
      // For each question, add its associated industries
      const questionsWithIndustries = await Promise.all(
        questions.map(async (question) => {
          const industries = await storage.getIndustriesByQuestionId(question.id);
          return {
            ...question,
            industries
          };
        })
      );
      
      res.json(questionsWithIndustries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const question = await storage.getCustomQuestion(id);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Get associated industries for this question
      const industries = await storage.getIndustriesByQuestionId(id);
      
      res.json({
        ...question,
        industries
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Get just the industries for a specific question
  app.get('/api/questions/:id/industries', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      // Check if question exists first
      const question = await storage.getCustomQuestion(id);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Get associated industries
      const industries = await storage.getIndustriesByQuestionId(id);
      console.log(`Industries for question ${id}:`, industries);
      
      res.json(industries);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/questions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const question = await storage.getCustomQuestion(id);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const updateSchema = insertCustomQuestionSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      // Debug the incoming data
      console.log('Updating question, received data:', {
        id,
        ...validData,
        industryIds: validData.industryIds
      });
      
      const updatedQuestion = await storage.updateCustomQuestion(id, validData);
      
      // If this is an industry question, handle industry associations
      if (validData.category === 'industry') {
        // Get current industry relationships
        const currentIndustries = await storage.getIndustriesByQuestionId(id);
        const currentIndustryIds = currentIndustries.map(i => i.id);
        
        console.log('Current industry IDs:', currentIndustryIds);
        
        // Process industry IDs, handling different formats
        let newIndustryIds: number[] = [];
        
        if (validData.industryIds !== undefined) {
          // Handle string, array of strings, or array of numbers
          if (Array.isArray(validData.industryIds)) {
            newIndustryIds = validData.industryIds.map(id => {
              if (typeof id === 'string') {
                return parseInt(id);
              } else if (typeof id === 'number') {
                return id;
              } else {
                console.warn(`Unexpected type for industry ID: ${typeof id}, value: ${id}`);
                return NaN; // This will be filtered out below
              }
            });
          } else if (typeof validData.industryIds === 'string') {
            newIndustryIds = [parseInt(validData.industryIds)];
          } else if (typeof validData.industryIds === 'number') {
            newIndustryIds = [validData.industryIds];
          }
          
          // Remove invalid IDs (NaN)
          newIndustryIds = newIndustryIds.filter(id => !isNaN(id));
          
          console.log('New industry IDs to apply:', newIndustryIds);
          
          // Remove industries that are no longer associated
          for (const industryId of currentIndustryIds) {
            if (!newIndustryIds.includes(industryId)) {
              console.log(`Removing industry ${industryId} from question ${id}`);
              await storage.removeQuestionIndustry(id, industryId);
            }
          }
          
          // Add new industry associations
          for (const industryId of newIndustryIds) {
            if (!currentIndustryIds.includes(industryId)) {
              console.log(`Adding industry ${industryId} to question ${id}`);
              await storage.addQuestionIndustry(id, industryId);
            }
          }
        } else {
          console.log('No industry IDs provided in update request');
        }
      }
      
      // Get updated list of associated industries
      const industries = await storage.getIndustriesByQuestionId(id);
      console.log('Final industries after update:', industries);
      
      // Return the updated data to the client
      res.json({
        ...updatedQuestion,
        industries: industries.map(i => String(i.id)) // Convert to string format for frontend
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/questions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const deleted = await storage.deleteCustomQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Custom question response APIs
  app.post('/api/question-responses', async (req: Request, res: Response) => {
    try {
      const validData = insertCustomQuestionResponseSchema.parse(req.body);
      const response = await storage.createCustomQuestionResponse(validData);
      res.status(201).json(response);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/question-responses/question/:questionId', async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      const responses = await storage.getCustomQuestionResponsesByQuestionId(questionId);
      res.json(responses);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/question-responses/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid response ID' });
      }
      
      const response = await storage.getCustomQuestionResponse(id);
      if (!response) {
        return res.status(404).json({ message: 'Response not found' });
      }
      
      res.json(response);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/question-responses/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid response ID' });
      }
      
      const response = await storage.getCustomQuestionResponse(id);
      if (!response) {
        return res.status(404).json({ message: 'Response not found' });
      }
      
      const updateSchema = insertCustomQuestionResponseSchema.partial();
      const validData = updateSchema.parse(req.body);
      
      const updatedResponse = await storage.updateCustomQuestionResponse(id, validData);
      res.json(updatedResponse);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  setupAdminRoutes(app);
  setupApiKeyRoutes(app);
  
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
  
  // Public assessment request endpoint - no authentication required
  app.post('/api/assessment-requests', async (req: Request, res: Response) => {
    try {
      const validData = insertAssessmentRequestSchema.parse(req.body);
      const assessmentRequest = await storage.createAssessmentRequest(validData);
      
      res.status(201).json({
        success: true,
        message: 'Assessment request submitted successfully',
        data: assessmentRequest
      });
    } catch (err) {
      handleError(err, res);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

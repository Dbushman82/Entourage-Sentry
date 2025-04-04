import { eq, and } from 'drizzle-orm';
import { db } from './db';
import * as schema from '../shared/schema';
import { 
  User, InsertUser, Contact, InsertContact, Company, InsertCompany,
  DomainData, InsertDomainData, Service, InsertService, NetworkAssessment,
  InsertNetworkAssessment, Cost, InsertCost, PainPoint, InsertPainPoint,
  Assessment, InsertAssessment, SecurityAssessment, InsertSecurityAssessment,
  AssessmentRequest, InsertAssessmentRequest, CustomQuestion, InsertCustomQuestion,
  CustomQuestionResponse, InsertCustomQuestionResponse
} from '../shared/schema';
import { IStorage } from './storage';
import { 
  generateAssessmentUrl, 
  verifyAssessmentToken, 
  calculateExpirationDate 
} from './utils/jwt';


export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, username));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values({
      ...user,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  // Contact methods
  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await db.insert(schema.contacts).values({
      ...contact,
      createdAt: new Date(),
      phone: contact.phone || null
    }).returning();
    return result[0];
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const contacts = await db.select().from(schema.contacts).where(eq(schema.contacts.id, id));
    return contacts[0];
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(schema.contacts)
      .set({
        ...contact,
        phone: contact.phone || null
      })
      .where(eq(schema.contacts.id, id))
      .returning();
    return result[0];
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(schema.companies).values({
      ...company,
      createdAt: new Date(),
      phone: company.phone || null,
      address: company.address || null,
      primaryContact: company.primaryContact || null,
      industry: company.industry || null,
      employeeCount: company.employeeCount || null,
      locationCount: company.locationCount || null,
      businessHours: company.businessHours || null,
      overview: company.overview || null,
      compliance: company.compliance || null,
      growthPlans: company.growthPlans || null
    }).returning();
    return result[0];
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const companies = await db.select().from(schema.companies).where(eq(schema.companies.id, id));
    return companies[0];
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const companies = await db.select().from(schema.companies).where(eq(schema.companies.website, domain));
    return companies[0];
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(schema.companies)
      .set({
        ...company,
        phone: company.phone !== undefined ? company.phone : null,
        address: company.address !== undefined ? company.address : null,
        primaryContact: company.primaryContact !== undefined ? company.primaryContact : null,
        industry: company.industry !== undefined ? company.industry : null,
        employeeCount: company.employeeCount !== undefined ? company.employeeCount : null,
        locationCount: company.locationCount !== undefined ? company.locationCount : null,
        businessHours: company.businessHours !== undefined ? company.businessHours : null,
        overview: company.overview !== undefined ? company.overview : null,
        compliance: company.compliance !== undefined ? company.compliance : null,
        growthPlans: company.growthPlans !== undefined ? company.growthPlans : null
      })
      .where(eq(schema.companies.id, id))
      .returning();
    return result[0];
  }

  // Domain data methods
  async createDomainData(domainData: InsertDomainData): Promise<DomainData> {
    const result = await db.insert(schema.domainData).values({
      ...domainData,
      createdAt: new Date(),
      registrationDate: domainData.registrationDate || null,
      sslExpiry: domainData.sslExpiry || null,
      mxRecords: domainData.mxRecords || null,
      emailSecurity: domainData.emailSecurity || null,
      hosting: domainData.hosting || null,
      techStack: domainData.techStack || null
    }).returning();
    return result[0];
  }

  async getDomainData(id: number): Promise<DomainData | undefined> {
    const data = await db.select().from(schema.domainData).where(eq(schema.domainData.id, id));
    return data[0];
  }

  async getDomainDataByCompanyId(companyId: number): Promise<DomainData | undefined> {
    const data = await db.select().from(schema.domainData).where(eq(schema.domainData.companyId, companyId));
    return data[0];
  }

  // Service methods
  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(schema.services).values({
      ...service,
      createdAt: new Date(),
      type: service.type || null,
      deployment: service.deployment || null,
      licenseCount: service.licenseCount || null,
      primaryAdmin: service.primaryAdmin || null,
      autoDetected: service.autoDetected || false
    }).returning();
    return result[0];
  }

  async getServicesByCompanyId(companyId: number): Promise<Service[]> {
    return await db.select().from(schema.services).where(eq(schema.services.companyId, companyId));
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(schema.services)
      .set({
        ...service,
        type: service.type !== undefined ? service.type : null,
        deployment: service.deployment !== undefined ? service.deployment : null,
        licenseCount: service.licenseCount !== undefined ? service.licenseCount : null,
        primaryAdmin: service.primaryAdmin !== undefined ? service.primaryAdmin : null,
        autoDetected: service.autoDetected !== undefined ? service.autoDetected : false
      })
      .where(eq(schema.services.id, id))
      .returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(schema.services).where(eq(schema.services.id, id)).returning();
    return result.length > 0;
  }

  // Network assessment methods
  async createNetworkAssessment(assessment: InsertNetworkAssessment): Promise<NetworkAssessment> {
    const result = await db.insert(schema.networkAssessments).values({
      ...assessment,
      ipAddress: assessment.ipAddress || null,
      isp: assessment.isp || null,
      connectionType: assessment.connectionType || null,
      hostname: assessment.hostname || null,
      userAgent: assessment.userAgent || null,
      operatingSystem: assessment.operatingSystem || null,
      bandwidth: assessment.bandwidth || null,
      bandwidthUnit: assessment.bandwidthUnit || null,
      routerModel: assessment.routerModel || null,
      topology: assessment.topology || null,
      deviceCounts: assessment.deviceCounts || null,
      notes: assessment.notes || null,
      scanData: assessment.scanData || null
    }).returning();
    return result[0];
  }

  async getNetworkAssessment(id: number): Promise<NetworkAssessment | undefined> {
    const assessments = await db.select().from(schema.networkAssessments).where(eq(schema.networkAssessments.id, id));
    return assessments[0];
  }

  async getNetworkAssessmentByCompanyId(companyId: number): Promise<NetworkAssessment | undefined> {
    const assessments = await db.select().from(schema.networkAssessments).where(eq(schema.networkAssessments.companyId, companyId));
    return assessments[0];
  }

  async updateNetworkAssessment(id: number, assessment: Partial<InsertNetworkAssessment>): Promise<NetworkAssessment | undefined> {
    // Create a clean update object without undefined values
    const updateData: Record<string, any> = {};
    
    // Only add defined properties to the update object
    if (assessment.companyId !== undefined) updateData.companyId = assessment.companyId;
    if (assessment.method !== undefined) updateData.method = assessment.method;
    if (assessment.ipAddress !== undefined) updateData.ipAddress = assessment.ipAddress || null;
    if (assessment.isp !== undefined) updateData.isp = assessment.isp || null;
    if (assessment.connectionType !== undefined) updateData.connectionType = assessment.connectionType || null;
    if (assessment.hostname !== undefined) updateData.hostname = assessment.hostname || null;
    if (assessment.userAgent !== undefined) updateData.userAgent = assessment.userAgent || null;
    if (assessment.operatingSystem !== undefined) updateData.operatingSystem = assessment.operatingSystem || null;
    if (assessment.bandwidth !== undefined) updateData.bandwidth = assessment.bandwidth || null;
    if (assessment.bandwidthUnit !== undefined) updateData.bandwidthUnit = assessment.bandwidthUnit || null;
    if (assessment.routerModel !== undefined) updateData.routerModel = assessment.routerModel || null;
    if (assessment.topology !== undefined) updateData.topology = assessment.topology || null;
    if (assessment.deviceCounts !== undefined) updateData.deviceCounts = assessment.deviceCounts || null;
    if (assessment.notes !== undefined) updateData.notes = assessment.notes || null;
    if (assessment.scanData !== undefined) updateData.scanData = assessment.scanData || null;
    
    const result = await db.update(schema.networkAssessments)
      .set(updateData)
      .where(eq(schema.networkAssessments.id, id))
      .returning();
    return result[0];
  }

  // Cost methods
  async createCost(cost: InsertCost): Promise<Cost> {
    const result = await db.insert(schema.costs).values({
      ...cost,
      createdAt: new Date(),
      serviceProvider: cost.serviceProvider || null,
      userCount: cost.userCount || null,
      renewalDate: cost.renewalDate || null,
      contractNotes: cost.contractNotes || null
    }).returning();
    return result[0];
  }

  async getCostsByCompanyId(companyId: number): Promise<Cost[]> {
    return await db.select().from(schema.costs).where(eq(schema.costs.companyId, companyId));
  }

  async getCost(id: number): Promise<Cost | undefined> {
    const costs = await db.select().from(schema.costs).where(eq(schema.costs.id, id));
    return costs[0];
  }

  async updateCost(id: number, cost: Partial<InsertCost>): Promise<Cost | undefined> {
    const result = await db.update(schema.costs)
      .set({
        ...cost,
        serviceProvider: cost.serviceProvider !== undefined ? cost.serviceProvider : null,
        userCount: cost.userCount !== undefined ? cost.userCount : null,
        renewalDate: cost.renewalDate !== undefined ? cost.renewalDate : null,
        contractNotes: cost.contractNotes !== undefined ? cost.contractNotes : null
      })
      .where(eq(schema.costs.id, id))
      .returning();
    return result[0];
  }

  async deleteCost(id: number): Promise<boolean> {
    const result = await db.delete(schema.costs).where(eq(schema.costs.id, id)).returning();
    return result.length > 0;
  }

  // Pain point methods
  async createPainPoint(painPoint: InsertPainPoint): Promise<PainPoint> {
    const result = await db.insert(schema.painPoints).values({
      ...painPoint,
      createdAt: new Date(),
      description: painPoint.description || null,
      priority: painPoint.priority || null,
      responseTime: painPoint.responseTime || null,
      interests: painPoint.interests || null,
      budget: painPoint.budget || null,
      timeline: painPoint.timeline || null,
      additionalNotes: painPoint.additionalNotes || null
    }).returning();
    return result[0];
  }

  async getPainPoint(id: number): Promise<PainPoint | undefined> {
    const points = await db.select().from(schema.painPoints).where(eq(schema.painPoints.id, id));
    return points[0];
  }

  async getPainPointByCompanyId(companyId: number): Promise<PainPoint | undefined> {
    const points = await db.select().from(schema.painPoints).where(eq(schema.painPoints.companyId, companyId));
    return points[0];
  }

  async updatePainPoint(id: number, painPoint: Partial<InsertPainPoint>): Promise<PainPoint | undefined> {
    const result = await db.update(schema.painPoints)
      .set({
        ...painPoint,
        description: painPoint.description !== undefined ? painPoint.description : null,
        priority: painPoint.priority !== undefined ? painPoint.priority : null,
        responseTime: painPoint.responseTime !== undefined ? painPoint.responseTime : null,
        interests: painPoint.interests !== undefined ? painPoint.interests : null,
        budget: painPoint.budget !== undefined ? painPoint.budget : null,
        timeline: painPoint.timeline !== undefined ? painPoint.timeline : null,
        additionalNotes: painPoint.additionalNotes !== undefined ? painPoint.additionalNotes : null
      })
      .where(eq(schema.painPoints.id, id))
      .returning();
    return result[0];
  }

  // Assessment methods
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const result = await db.insert(schema.assessments).values({
      ...assessment,
      createdAt: new Date(),
      completedAt: null,
      status: assessment.status || 'draft',
      domainDataId: assessment.domainDataId || null,
      networkAssessmentId: assessment.networkAssessmentId || null,
      painPointId: assessment.painPointId || null,
      currentStep: assessment.currentStep || 1
    }).returning();
    return result[0];
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const assessments = await db.select().from(schema.assessments).where(eq(schema.assessments.id, id));
    return assessments[0];
  }

  async getAssessmentByReferenceCode(referenceCode: string): Promise<Assessment | undefined> {
    const assessments = await db.select().from(schema.assessments).where(eq(schema.assessments.referenceCode, referenceCode));
    return assessments[0];
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return await db.select().from(schema.assessments);
  }

  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const result = await db.update(schema.assessments)
      .set({
        ...assessment,
        status: assessment.status || 'draft',
        domainDataId: assessment.domainDataId !== undefined ? assessment.domainDataId : null,
        networkAssessmentId: assessment.networkAssessmentId !== undefined ? assessment.networkAssessmentId : null,
        painPointId: assessment.painPointId !== undefined ? assessment.painPointId : null,
        currentStep: assessment.currentStep !== undefined ? assessment.currentStep : 1
      })
      .where(eq(schema.assessments.id, id))
      .returning();
    return result[0];
  }

  async deleteAssessment(id: number): Promise<boolean> {
    const result = await db.delete(schema.assessments).where(eq(schema.assessments.id, id)).returning();
    return result.length > 0;
  }

  async getAssessmentDetails(id: number): Promise<any> {
    const assessment = await this.getAssessment(id);
    if (!assessment) return null;

    const contact = await this.getContact(assessment.contactId);
    const company = await this.getCompany(assessment.companyId);
    
    let domainData = null;
    if (assessment.domainDataId) {
      domainData = await this.getDomainData(assessment.domainDataId);
    }

    let networkAssessment = null;
    if (assessment.networkAssessmentId) {
      networkAssessment = await this.getNetworkAssessment(assessment.networkAssessmentId);
    }

    let painPoint = null;
    if (assessment.painPointId) {
      painPoint = await this.getPainPoint(assessment.painPointId);
    }

    const services = await this.getServicesByCompanyId(assessment.companyId);
    const costs = await this.getCostsByCompanyId(assessment.companyId);

    return {
      assessment,
      contact,
      company,
      domainData,
      networkAssessment,
      painPoint,
      services,
      costs
    };
  }

  // User management methods for admin
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set({
        ...userData,
        // Ensure default values are maintained
        active: userData.active !== undefined ? userData.active : true
      })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return result.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }
  
  // Assessment request methods
  async createAssessmentRequest(request: InsertAssessmentRequest): Promise<AssessmentRequest> {
    const result = await db.insert(schema.assessmentRequests).values({
      ...request,
      createdAt: new Date(),
      status: "pending",
      processedAt: null,
      processedBy: null
    }).returning();
    return result[0];
  }
  
  async getAssessmentRequest(id: number): Promise<AssessmentRequest | undefined> {
    const requests = await db.select().from(schema.assessmentRequests).where(eq(schema.assessmentRequests.id, id));
    return requests[0];
  }
  
  async getAllAssessmentRequests(): Promise<AssessmentRequest[]> {
    return await db.select().from(schema.assessmentRequests);
  }
  
  async getPendingAssessmentRequests(): Promise<AssessmentRequest[]> {
    return await db.select().from(schema.assessmentRequests).where(eq(schema.assessmentRequests.status, "pending"));
  }
  
  async updateAssessmentRequest(id: number, requestData: Partial<AssessmentRequest>): Promise<AssessmentRequest | undefined> {
    const result = await db.update(schema.assessmentRequests)
      .set({
        ...requestData,
        phone: requestData.phone !== undefined ? requestData.phone : null,
        companyWebsite: requestData.companyWebsite !== undefined ? requestData.companyWebsite : null,
        message: requestData.message !== undefined ? requestData.message : null,
        processedAt: requestData.processedAt || null,
        processedBy: requestData.processedBy || null
      })
      .where(eq(schema.assessmentRequests.id, id))
      .returning();
    return result[0];
  }

  // System settings methods for branding
  async updateSystemSetting(key: string, value: string): Promise<void> {
    // First check if the setting exists
    const existingSetting = await db.select().from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key));
    
    if (existingSetting.length > 0) {
      // Update existing setting
      await db.update(schema.systemSettings)
        .set({ value })
        .where(eq(schema.systemSettings.key, key));
    } else {
      // Create new setting
      await db.insert(schema.systemSettings).values({
        key,
        value,
        createdAt: new Date()
      });
    }
  }

  async getSystemSetting(key: string): Promise<string | null> {
    const settings = await db.select().from(schema.systemSettings)
      .where(eq(schema.systemSettings.key, key));
    
    if (settings.length > 0) {
      return settings[0].value;
    }
    return null;
  }

  // Scanner version methods
  async createScannerVersion(version: any): Promise<any> {
    const result = await db.insert(schema.scannerVersions).values({
      ...version,
      uploadedAt: new Date()
    }).returning();
    return result[0];
  }

  async getScannerVersion(id: number): Promise<any | undefined> {
    const versions = await db.select().from(schema.scannerVersions)
      .where(eq(schema.scannerVersions.id, id));
    return versions[0];
  }

  async getAllScannerVersions(): Promise<any[]> {
    return await db.select().from(schema.scannerVersions);
  }

  async deleteScannerVersion(id: number): Promise<boolean> {
    const result = await db.delete(schema.scannerVersions)
      .where(eq(schema.scannerVersions.id, id))
      .returning();
    return result.length > 0;
  }

  // Assessment link management
  async generateAssessmentLink(id: number, expirationDuration: string): Promise<{ url: string, expiration: Date }> {
    const assessment = await this.getAssessment(id);
    if (!assessment) {
      throw new Error(`Assessment with ID ${id} not found`);
    }
    
    // Calculate expiration date
    const expiration = calculateExpirationDate(expirationDuration);
    
    // Generate signed URL
    const url = generateAssessmentUrl(id, assessment.referenceCode, expirationDuration);
    
    // Extract token from the URL
    const token = url.split('token=')[1];
    
    // Update assessment with token and expiration
    await this.updateAssessment(id, {
      linkToken: token,
      linkExpiration: expiration
    });
    
    return { url, expiration };
  }

  async renewAssessmentLink(id: number, expirationDuration: string): Promise<{ url: string, expiration: Date }> {
    // Simply reuse the generate function since the logic is the same
    return this.generateAssessmentLink(id, expirationDuration);
  }

  async verifyAssessmentLink(token: string): Promise<Assessment | null> {
    // Verify the token
    const decoded = verifyAssessmentToken(token);
    if (!decoded) {
      return null;
    }
    
    // Get the assessment
    const assessment = await this.getAssessment(decoded.assessmentId);
    if (!assessment) {
      return null;
    }
    
    // Check if the token matches
    if (assessment.linkToken !== token) {
      return null;
    }
    
    // Check if the token has expired
    if (assessment.linkExpiration && new Date(assessment.linkExpiration) < new Date()) {
      return null;
    }
    
    return assessment;
  }

  // Security assessment methods
  async createSecurityAssessment(assessment: InsertSecurityAssessment): Promise<SecurityAssessment> {
    // Only include properties that match the schema
    const values = {
      companyId: assessment.companyId,
      domain: assessment.domain,
      securityScore: assessment.securityScore || null,
      technologies: assessment.technologies || [],
      exposedServices: assessment.exposedServices || [],
      vulnerabilitiesHigh: assessment.vulnerabilitiesHigh || 0,
      vulnerabilitiesMedium: assessment.vulnerabilitiesMedium || 0,
      vulnerabilitiesLow: assessment.vulnerabilitiesLow || 0,
      vulnerabilitiesInfo: assessment.vulnerabilitiesInfo || 0,
      presentSecurityHeaders: assessment.presentSecurityHeaders || [],
      missingSecurityHeaders: assessment.missingSecurityHeaders || [],
      subdomains: assessment.subdomains || [],
      recommendations: assessment.recommendations || [],
      rawData: assessment.rawData || null
    };
    
    const result = await db.insert(schema.securityAssessments).values(values).returning();
    return result[0];
  }

  async getSecurityAssessment(id: number): Promise<SecurityAssessment | undefined> {
    const assessments = await db.select().from(schema.securityAssessments).where(eq(schema.securityAssessments.id, id));
    return assessments[0];
  }

  async getSecurityAssessmentByCompanyId(companyId: number): Promise<SecurityAssessment | undefined> {
    const assessments = await db.select().from(schema.securityAssessments).where(eq(schema.securityAssessments.companyId, companyId));
    return assessments[0];
  }

  async updateSecurityAssessment(id: number, assessment: Partial<InsertSecurityAssessment>): Promise<SecurityAssessment | undefined> {
    // Create a clean update object without undefined values
    const updateData: Record<string, any> = {};
    
    // Only add defined properties that match the schema
    if (assessment.companyId !== undefined) updateData.companyId = assessment.companyId;
    if (assessment.domain !== undefined) updateData.domain = assessment.domain;
    if (assessment.securityScore !== undefined) updateData.securityScore = assessment.securityScore;
    if (assessment.technologies !== undefined) updateData.technologies = assessment.technologies;
    if (assessment.exposedServices !== undefined) updateData.exposedServices = assessment.exposedServices;
    if (assessment.vulnerabilitiesHigh !== undefined) updateData.vulnerabilitiesHigh = assessment.vulnerabilitiesHigh;
    if (assessment.vulnerabilitiesMedium !== undefined) updateData.vulnerabilitiesMedium = assessment.vulnerabilitiesMedium;
    if (assessment.vulnerabilitiesLow !== undefined) updateData.vulnerabilitiesLow = assessment.vulnerabilitiesLow;
    if (assessment.vulnerabilitiesInfo !== undefined) updateData.vulnerabilitiesInfo = assessment.vulnerabilitiesInfo;
    if (assessment.presentSecurityHeaders !== undefined) updateData.presentSecurityHeaders = assessment.presentSecurityHeaders;
    if (assessment.missingSecurityHeaders !== undefined) updateData.missingSecurityHeaders = assessment.missingSecurityHeaders;
    if (assessment.subdomains !== undefined) updateData.subdomains = assessment.subdomains;
    if (assessment.recommendations !== undefined) updateData.recommendations = assessment.recommendations;
    if (assessment.rawData !== undefined) updateData.rawData = assessment.rawData;
    
    const result = await db.update(schema.securityAssessments)
      .set(updateData)
      .where(eq(schema.securityAssessments.id, id))
      .returning();
    return result[0];
  }

  // Custom question methods
  async createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion> {
    const result = await db.insert(schema.customQuestions).values({
      ...question,
      createdAt: new Date(),
      description: question.description || null,
      type: question.type || 'text',
      options: question.options || [],
      order: question.order || 0
    }).returning();
    return result[0];
  }
  
  async getCustomQuestion(id: number): Promise<CustomQuestion | undefined> {
    const questions = await db.select().from(schema.customQuestions).where(eq(schema.customQuestions.id, id));
    return questions[0];
  }
  
  async getCustomQuestionsByAssessmentId(assessmentId: number): Promise<CustomQuestion[]> {
    return await db.select()
      .from(schema.customQuestions)
      .where(eq(schema.customQuestions.assessmentId, assessmentId))
      .orderBy(schema.customQuestions.order);
  }
  
  async updateCustomQuestion(id: number, question: Partial<InsertCustomQuestion>): Promise<CustomQuestion | undefined> {
    const updateData: Record<string, any> = {};
    
    if (question.assessmentId !== undefined) updateData.assessmentId = question.assessmentId;
    if (question.question !== undefined) updateData.question = question.question;
    if (question.description !== undefined) updateData.description = question.description || null;
    if (question.type !== undefined) updateData.type = question.type;
    if (question.options !== undefined) updateData.options = question.options;
    if (question.required !== undefined) updateData.required = question.required;
    if (question.order !== undefined) updateData.order = question.order;
    if (question.createdBy !== undefined) updateData.createdBy = question.createdBy;
    
    const result = await db.update(schema.customQuestions)
      .set(updateData)
      .where(eq(schema.customQuestions.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCustomQuestion(id: number): Promise<boolean> {
    const result = await db.delete(schema.customQuestions).where(eq(schema.customQuestions.id, id)).returning();
    return result.length > 0;
  }
  
  // Custom question response methods
  async createCustomQuestionResponse(response: InsertCustomQuestionResponse): Promise<CustomQuestionResponse> {
    const result = await db.insert(schema.customQuestionResponses).values({
      ...response,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async getCustomQuestionResponse(id: number): Promise<CustomQuestionResponse | undefined> {
    const responses = await db.select().from(schema.customQuestionResponses).where(eq(schema.customQuestionResponses.id, id));
    return responses[0];
  }
  
  async getCustomQuestionResponsesByQuestionId(questionId: number): Promise<CustomQuestionResponse[]> {
    return await db.select()
      .from(schema.customQuestionResponses)
      .where(eq(schema.customQuestionResponses.questionId, questionId));
  }
  
  async updateCustomQuestionResponse(id: number, response: Partial<InsertCustomQuestionResponse>): Promise<CustomQuestionResponse | undefined> {
    const updateData: Record<string, any> = {};
    
    if (response.questionId !== undefined) updateData.questionId = response.questionId;
    if (response.response !== undefined) updateData.response = response.response;
    
    const result = await db.update(schema.customQuestionResponses)
      .set(updateData)
      .where(eq(schema.customQuestionResponses.id, id))
      .returning();
    return result[0];
  }
}
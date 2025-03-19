import { eq, and } from 'drizzle-orm';
import { db } from './db';
import * as schema from '../shared/schema';
import { 
  User, InsertUser, Contact, InsertContact, Company, InsertCompany,
  DomainData, InsertDomainData, Service, InsertService, NetworkAssessment,
  InsertNetworkAssessment, Cost, InsertCost, PainPoint, InsertPainPoint,
  Assessment, InsertAssessment
} from '../shared/schema';
import { IStorage } from './storage';


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
    const result = await db.update(schema.networkAssessments)
      .set({
        ...assessment,
        ipAddress: assessment.ipAddress !== undefined ? assessment.ipAddress : null,
        isp: assessment.isp !== undefined ? assessment.isp : null,
        connectionType: assessment.connectionType !== undefined ? assessment.connectionType : null,
        hostname: assessment.hostname !== undefined ? assessment.hostname : null,
        userAgent: assessment.userAgent !== undefined ? assessment.userAgent : null,
        bandwidthUp: assessment.bandwidthUp !== undefined ? assessment.bandwidthUp : null,
        bandwidthDown: assessment.bandwidthDown !== undefined ? assessment.bandwidthDown : null,
        latency: assessment.latency !== undefined ? assessment.latency : null,
        routerModel: assessment.routerModel !== undefined ? assessment.routerModel : null,
        topology: assessment.topology !== undefined ? assessment.topology : null,
        deviceCounts: assessment.deviceCounts !== undefined ? assessment.deviceCounts : null,
        scanData: assessment.scanData !== undefined ? assessment.scanData : null
      })
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
}
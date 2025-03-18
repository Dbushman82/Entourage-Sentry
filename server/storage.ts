import {
  users, type User, type InsertUser,
  contacts, type Contact, type InsertContact,
  companies, type Company, type InsertCompany,
  domainData, type DomainData, type InsertDomainData,
  services, type Service, type InsertService,
  networkAssessments, type NetworkAssessment, type InsertNetworkAssessment,
  costs, type Cost, type InsertCost,
  painPoints, type PainPoint, type InsertPainPoint,
  assessments, type Assessment, type InsertAssessment
} from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contact methods
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;

  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;

  // Domain data methods
  createDomainData(domainData: InsertDomainData): Promise<DomainData>;
  getDomainData(id: number): Promise<DomainData | undefined>;
  getDomainDataByCompanyId(companyId: number): Promise<DomainData | undefined>;

  // Service methods
  createService(service: InsertService): Promise<Service>;
  getServicesByCompanyId(companyId: number): Promise<Service[]>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Network assessment methods
  createNetworkAssessment(assessment: InsertNetworkAssessment): Promise<NetworkAssessment>;
  getNetworkAssessment(id: number): Promise<NetworkAssessment | undefined>;
  getNetworkAssessmentByCompanyId(companyId: number): Promise<NetworkAssessment | undefined>;
  updateNetworkAssessment(id: number, assessment: Partial<InsertNetworkAssessment>): Promise<NetworkAssessment | undefined>;

  // Cost methods
  createCost(cost: InsertCost): Promise<Cost>;
  getCostsByCompanyId(companyId: number): Promise<Cost[]>;
  getCost(id: number): Promise<Cost | undefined>;
  updateCost(id: number, cost: Partial<InsertCost>): Promise<Cost | undefined>;
  deleteCost(id: number): Promise<boolean>;

  // Pain point methods
  createPainPoint(painPoint: InsertPainPoint): Promise<PainPoint>;
  getPainPoint(id: number): Promise<PainPoint | undefined>;
  getPainPointByCompanyId(companyId: number): Promise<PainPoint | undefined>;
  updatePainPoint(id: number, painPoint: Partial<InsertPainPoint>): Promise<PainPoint | undefined>;

  // Assessment methods
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentByReferenceCode(referenceCode: string): Promise<Assessment | undefined>;
  getAllAssessments(): Promise<Assessment[]>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  getAssessmentDetails(id: number): Promise<any>; // Returns all related data in a combined object
}

export class MemStorage implements IStorage {
  private userIdCounter: number = 1;
  private users: Map<number, User> = new Map();
  
  private contactIdCounter: number = 1;
  private contacts: Map<number, Contact> = new Map();
  
  private companyIdCounter: number = 1;
  private companies: Map<number, Company> = new Map();
  
  private domainDataIdCounter: number = 1;
  private domainDatas: Map<number, DomainData> = new Map();
  
  private serviceIdCounter: number = 1;
  private services: Map<number, Service> = new Map();
  
  private networkAssessmentIdCounter: number = 1;
  private networkAssessments: Map<number, NetworkAssessment> = new Map();
  
  private costIdCounter: number = 1;
  private costs: Map<number, Cost> = new Map();
  
  private painPointIdCounter: number = 1;
  private painPoints: Map<number, PainPoint> = new Map();
  
  private assessmentIdCounter: number = 1;
  private assessments: Map<number, Assessment> = new Map();

  constructor() {
    // Initialize with some data if needed
  }

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contact methods
  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.contactIdCounter++;
    const now = new Date();
    const newContact: Contact = { ...contact, id, createdAt: now };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;
    
    const updatedContact = { ...existingContact, ...contact };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.companyIdCounter++;
    const now = new Date();
    const newCompany: Company = { ...company, id, createdAt: now };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return Array.from(this.companies.values()).find(
      (company) => {
        const companyDomain = company.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        return companyDomain === normalizedDomain;
      }
    );
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existingCompany = this.companies.get(id);
    if (!existingCompany) return undefined;
    
    const updatedCompany = { ...existingCompany, ...company };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  // Domain data methods
  async createDomainData(data: InsertDomainData): Promise<DomainData> {
    const id = this.domainDataIdCounter++;
    const now = new Date();
    const newDomainData: DomainData = { ...data, id, createdAt: now };
    this.domainDatas.set(id, newDomainData);
    return newDomainData;
  }

  async getDomainData(id: number): Promise<DomainData | undefined> {
    return this.domainDatas.get(id);
  }

  async getDomainDataByCompanyId(companyId: number): Promise<DomainData | undefined> {
    return Array.from(this.domainDatas.values()).find(
      (data) => data.companyId === companyId
    );
  }

  // Service methods
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const now = new Date();
    const newService: Service = { ...service, id, createdAt: now };
    this.services.set(id, newService);
    return newService;
  }

  async getServicesByCompanyId(companyId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.companyId === companyId
    );
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService = { ...existingService, ...service };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Network assessment methods
  async createNetworkAssessment(assessment: InsertNetworkAssessment): Promise<NetworkAssessment> {
    const id = this.networkAssessmentIdCounter++;
    const now = new Date();
    const newAssessment: NetworkAssessment = { ...assessment, id, createdAt: now };
    this.networkAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async getNetworkAssessment(id: number): Promise<NetworkAssessment | undefined> {
    return this.networkAssessments.get(id);
  }

  async getNetworkAssessmentByCompanyId(companyId: number): Promise<NetworkAssessment | undefined> {
    return Array.from(this.networkAssessments.values()).find(
      (assessment) => assessment.companyId === companyId
    );
  }

  async updateNetworkAssessment(id: number, assessment: Partial<InsertNetworkAssessment>): Promise<NetworkAssessment | undefined> {
    const existingAssessment = this.networkAssessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...assessment };
    this.networkAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  // Cost methods
  async createCost(cost: InsertCost): Promise<Cost> {
    const id = this.costIdCounter++;
    const now = new Date();
    const newCost: Cost = { ...cost, id, createdAt: now };
    this.costs.set(id, newCost);
    return newCost;
  }

  async getCostsByCompanyId(companyId: number): Promise<Cost[]> {
    return Array.from(this.costs.values()).filter(
      (cost) => cost.companyId === companyId
    );
  }

  async getCost(id: number): Promise<Cost | undefined> {
    return this.costs.get(id);
  }

  async updateCost(id: number, cost: Partial<InsertCost>): Promise<Cost | undefined> {
    const existingCost = this.costs.get(id);
    if (!existingCost) return undefined;
    
    const updatedCost = { ...existingCost, ...cost };
    this.costs.set(id, updatedCost);
    return updatedCost;
  }

  async deleteCost(id: number): Promise<boolean> {
    return this.costs.delete(id);
  }

  // Pain point methods
  async createPainPoint(painPoint: InsertPainPoint): Promise<PainPoint> {
    const id = this.painPointIdCounter++;
    const now = new Date();
    const newPainPoint: PainPoint = { ...painPoint, id, createdAt: now };
    this.painPoints.set(id, newPainPoint);
    return newPainPoint;
  }

  async getPainPoint(id: number): Promise<PainPoint | undefined> {
    return this.painPoints.get(id);
  }

  async getPainPointByCompanyId(companyId: number): Promise<PainPoint | undefined> {
    return Array.from(this.painPoints.values()).find(
      (painPoint) => painPoint.companyId === companyId
    );
  }

  async updatePainPoint(id: number, painPoint: Partial<InsertPainPoint>): Promise<PainPoint | undefined> {
    const existingPainPoint = this.painPoints.get(id);
    if (!existingPainPoint) return undefined;
    
    const updatedPainPoint = { ...existingPainPoint, ...painPoint };
    this.painPoints.set(id, updatedPainPoint);
    return updatedPainPoint;
  }

  // Assessment methods
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const now = new Date();
    const newAssessment: Assessment = { ...assessment, id, createdAt: now, completedAt: null };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessmentByReferenceCode(referenceCode: string): Promise<Assessment | undefined> {
    return Array.from(this.assessments.values()).find(
      (assessment) => assessment.referenceCode === referenceCode
    );
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }

  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...assessment };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  async deleteAssessment(id: number): Promise<boolean> {
    return this.assessments.delete(id);
  }

  async getAssessmentDetails(id: number): Promise<any> {
    const assessment = await this.getAssessment(id);
    if (!assessment) return null;

    const contact = await this.getContact(assessment.contactId);
    const company = await this.getCompany(assessment.companyId);
    const domainData = assessment.domainDataId ? await this.getDomainData(assessment.domainDataId) : null;
    const networkAssessment = assessment.networkAssessmentId ? await this.getNetworkAssessment(assessment.networkAssessmentId) : null;
    const painPoint = assessment.painPointId ? await this.getPainPoint(assessment.painPointId) : null;
    const services = company ? await this.getServicesByCompanyId(company.id) : [];
    const costs = company ? await this.getCostsByCompanyId(company.id) : [];

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

export const storage = new MemStorage();

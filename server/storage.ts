import {
  users, type User, type InsertUser,
  contacts, type Contact, type InsertContact,
  companies, type Company, type InsertCompany,
  domainData, type DomainData, type InsertDomainData,
  services, type Service, type InsertService,
  networkAssessments, type NetworkAssessment, type InsertNetworkAssessment,
  costs, type Cost, type InsertCost,
  expenses, type Expense, type InsertExpense,
  painPoints, type PainPoint, type InsertPainPoint,
  assessments, type Assessment, type InsertAssessment,
  securityAssessments, type SecurityAssessment, type InsertSecurityAssessment,
  assessmentRequests, type AssessmentRequest, type InsertAssessmentRequest,
  customQuestions, type CustomQuestion, type InsertCustomQuestion,
  customQuestionResponses, type CustomQuestionResponse, type InsertCustomQuestionResponse,
  industries, type Industry, type InsertIndustry,
  questionIndustries
} from "@shared/schema";

import { 
  generateAssessmentUrl, 
  verifyAssessmentToken, 
  calculateExpirationDate 
} from './utils/jwt';

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Assessment request methods (for prospects)
  createAssessmentRequest(request: InsertAssessmentRequest): Promise<AssessmentRequest>;
  getAssessmentRequest(id: number): Promise<AssessmentRequest | undefined>;
  getAllAssessmentRequests(): Promise<AssessmentRequest[]>;
  getPendingAssessmentRequests(): Promise<AssessmentRequest[]>;
  updateAssessmentRequest(id: number, request: Partial<AssessmentRequest>): Promise<AssessmentRequest | undefined>;
  
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
  
  // Expense methods (unified service and cost tracking)
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByCompanyId(companyId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

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
  
  // Assessment link management
  generateAssessmentLink(id: number, expirationDuration: string): Promise<{ url: string, expiration: Date }>;
  renewAssessmentLink(id: number, expirationDuration: string): Promise<{ url: string, expiration: Date }>;
  verifyAssessmentLink(token: string): Promise<Assessment | null>;
  
  // System settings methods (for branding, etc.)
  updateSystemSetting(key: string, value: string): Promise<void>;
  getSystemSetting(key: string): Promise<string | null>;
  
  // Scanner version methods
  createScannerVersion(version: any): Promise<any>;
  getScannerVersion(id: number): Promise<any | undefined>;
  getAllScannerVersions(): Promise<any[]>;
  deleteScannerVersion(id: number): Promise<boolean>;
  
  // Security assessment methods
  createSecurityAssessment(assessment: InsertSecurityAssessment): Promise<SecurityAssessment>;
  getSecurityAssessment(id: number): Promise<SecurityAssessment | undefined>;
  getSecurityAssessmentByCompanyId(companyId: number): Promise<SecurityAssessment | undefined>;
  updateSecurityAssessment(id: number, assessment: Partial<InsertSecurityAssessment>): Promise<SecurityAssessment | undefined>;
  
  // Industry management methods
  createIndustry(industry: InsertIndustry): Promise<Industry>;
  getIndustry(id: number): Promise<Industry | undefined>;
  getIndustryByName(name: string): Promise<Industry | undefined>;
  getAllIndustries(): Promise<Industry[]>;
  updateIndustry(id: number, industry: Partial<InsertIndustry>): Promise<Industry | undefined>;
  deleteIndustry(id: number): Promise<boolean>;
  
  // Question-Industry relationship methods
  addQuestionIndustry(questionId: number, industryId: number): Promise<void>;
  removeQuestionIndustry(questionId: number, industryId: number): Promise<void>;
  getIndustriesByQuestionId(questionId: number): Promise<Industry[]>;
  getQuestionsByIndustryId(industryId: number): Promise<CustomQuestion[]>;

  // Custom questions methods
  createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion>;
  getCustomQuestion(id: number): Promise<CustomQuestion | undefined>;
  getCustomQuestionsByAssessmentId(assessmentId: number): Promise<CustomQuestion[]>;
  getGlobalQuestions(): Promise<CustomQuestion[]>;
  getIndustryQuestions(): Promise<CustomQuestion[]>;
  updateCustomQuestion(id: number, question: Partial<InsertCustomQuestion>): Promise<CustomQuestion | undefined>;
  deleteCustomQuestion(id: number): Promise<boolean>;
  
  // Custom question responses methods
  createCustomQuestionResponse(response: InsertCustomQuestionResponse): Promise<CustomQuestionResponse>;
  getCustomQuestionResponse(id: number): Promise<CustomQuestionResponse | undefined>;
  getCustomQuestionResponsesByQuestionId(questionId: number): Promise<CustomQuestionResponse[]>;
  updateCustomQuestionResponse(id: number, response: Partial<InsertCustomQuestionResponse>): Promise<CustomQuestionResponse | undefined>;
}

export class MemStorage implements IStorage {
  private userIdCounter: number = 1;
  private users: Map<number, User> = new Map();
  
  private assessmentRequestIdCounter: number = 1;
  private assessmentRequests: Map<number, AssessmentRequest> = new Map();
  
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
  
  private expenseIdCounter: number = 1;
  private expenses: Map<number, Expense> = new Map();
  
  private painPointIdCounter: number = 1;
  private painPoints: Map<number, PainPoint> = new Map();
  
  private assessmentIdCounter: number = 1;
  private assessments: Map<number, Assessment> = new Map();
  
  private systemSettings: Map<string, string> = new Map();
  
  private scannerVersionIdCounter: number = 1;
  private scannerVersions: Map<number, any> = new Map();
  
  private securityAssessmentIdCounter: number = 1;
  private securityAssessments: Map<number, SecurityAssessment> = new Map();
  
  private customQuestionIdCounter: number = 1;
  private customQuestions: Map<number, CustomQuestion> = new Map();
  
  private customQuestionResponseIdCounter: number = 1;
  private customQuestionResponses: Map<number, CustomQuestionResponse> = new Map();
  
  private industryIdCounter: number = 1;
  private industries: Map<number, Industry> = new Map();
  
  // Junction table for question-industry relationships
  private questionIndustries: Map<string, { questionId: number; industryId: number }> = new Map();

  constructor() {
    // Initialize with some data if needed
    // Add an admin user by default
    this.createUser({
      username: 'Dbushman',
      email: 'dave@entourageit.com',
      password: 'e2fc714c4727ee9395f324cd2e7f331f.ab23da5e23ca48eee3c4ba64b3308688', // 'mypassword' hashed
      role: 'admin'
    });
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
  
  // Expense methods (unified service and cost tracking)
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const now = new Date();
    const newExpense: Expense = { 
      ...expense, 
      id, 
      createdAt: now 
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async getExpensesByCompanyId(companyId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.companyId === companyId
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) return undefined;
    
    const updatedExpense = { ...existingExpense, ...expense };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
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
    const expenses = company ? await this.getExpensesByCompanyId(company.id) : [];
    const customQuestions = await this.getCustomQuestionsByAssessmentId(assessment.id);
    
    // Get all responses for each question
    const customQuestionsWithResponses = await Promise.all(
      customQuestions.map(async (question) => {
        const responses = await this.getCustomQuestionResponsesByQuestionId(question.id);
        return {
          ...question,
          responses
        };
      })
    );

    return {
      assessment,
      contact,
      company,
      domainData,
      networkAssessment,
      painPoint,
      services,
      costs,
      expenses,
      customQuestions: customQuestionsWithResponses
    };
  }
  
  // Admin methods
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Assessment request methods
  async createAssessmentRequest(request: InsertAssessmentRequest): Promise<AssessmentRequest> {
    const id = this.assessmentRequestIdCounter++;
    const now = new Date();
    const newRequest: AssessmentRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: now,
      processedAt: null,
      processedBy: null
    };
    this.assessmentRequests.set(id, newRequest);
    return newRequest;
  }
  
  async getAssessmentRequest(id: number): Promise<AssessmentRequest | undefined> {
    return this.assessmentRequests.get(id);
  }
  
  async getAllAssessmentRequests(): Promise<AssessmentRequest[]> {
    return Array.from(this.assessmentRequests.values());
  }
  
  async getPendingAssessmentRequests(): Promise<AssessmentRequest[]> {
    return Array.from(this.assessmentRequests.values())
      .filter(request => request.status === "pending");
  }
  
  async updateAssessmentRequest(id: number, requestData: Partial<AssessmentRequest>): Promise<AssessmentRequest | undefined> {
    const existingRequest = this.assessmentRequests.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...requestData };
    this.assessmentRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Assessment link methods
  
  // System settings methods
  async updateSystemSetting(key: string, value: string): Promise<void> {
    this.systemSettings.set(key, value);
  }
  
  async getSystemSetting(key: string): Promise<string | null> {
    return this.systemSettings.get(key) || null;
  }
  
  // Scanner version methods
  async createScannerVersion(version: any): Promise<any> {
    const id = this.scannerVersionIdCounter++;
    const newVersion = { ...version, id };
    this.scannerVersions.set(id, newVersion);
    return newVersion;
  }
  
  async getScannerVersion(id: number): Promise<any | undefined> {
    return this.scannerVersions.get(id);
  }
  
  async getAllScannerVersions(): Promise<any[]> {
    return Array.from(this.scannerVersions.values());
  }
  
  async deleteScannerVersion(id: number): Promise<boolean> {
    return this.scannerVersions.delete(id);
  }
  
  // Security assessment methods
  async createSecurityAssessment(assessment: InsertSecurityAssessment): Promise<SecurityAssessment> {
    const id = this.securityAssessmentIdCounter++;
    const now = new Date();
    const newAssessment: SecurityAssessment = { 
      ...assessment, 
      id, 
      createdAt: now,
      scanDate: now,
      technologies: assessment.technologies || [],
      exposedServices: assessment.exposedServices || [],
      vulnerabilitiesHigh: assessment.vulnerabilitiesHigh || 0,
      vulnerabilitiesMedium: assessment.vulnerabilitiesMedium || 0,
      vulnerabilitiesLow: assessment.vulnerabilitiesLow || 0,
      vulnerabilitiesInfo: assessment.vulnerabilitiesInfo || 0, 
      presentSecurityHeaders: assessment.presentSecurityHeaders || [],
      missingSecurityHeaders: assessment.missingSecurityHeaders || [],
      subdomains: assessment.subdomains || [],
      recommendations: assessment.recommendations || []
    };
    this.securityAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async getSecurityAssessment(id: number): Promise<SecurityAssessment | undefined> {
    return this.securityAssessments.get(id);
  }

  async getSecurityAssessmentByCompanyId(companyId: number): Promise<SecurityAssessment | undefined> {
    return Array.from(this.securityAssessments.values()).find(
      (assessment) => assessment.companyId === companyId
    );
  }

  async updateSecurityAssessment(id: number, assessment: Partial<InsertSecurityAssessment>): Promise<SecurityAssessment | undefined> {
    const existingAssessment = this.securityAssessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...assessment };
    this.securityAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  // Industry management methods
  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const id = this.industryIdCounter++;
    const now = new Date();
    const newIndustry: Industry = {
      ...industry,
      id,
      createdAt: now
    };
    this.industries.set(id, newIndustry);
    return newIndustry;
  }

  async getIndustry(id: number): Promise<Industry | undefined> {
    return this.industries.get(id);
  }

  async getIndustryByName(name: string): Promise<Industry | undefined> {
    return Array.from(this.industries.values()).find(
      (industry) => industry.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getAllIndustries(): Promise<Industry[]> {
    return Array.from(this.industries.values());
  }

  async updateIndustry(id: number, industryData: Partial<InsertIndustry>): Promise<Industry | undefined> {
    const existingIndustry = this.industries.get(id);
    if (!existingIndustry) return undefined;
    
    const updatedIndustry = { ...existingIndustry, ...industryData };
    this.industries.set(id, updatedIndustry);
    return updatedIndustry;
  }

  async deleteIndustry(id: number): Promise<boolean> {
    // First delete all relationships with questions
    const keys = Array.from(this.questionIndustries.entries())
      .filter(([, rel]) => rel.industryId === id)
      .map(([key]) => key);
      
    for (const key of keys) {
      this.questionIndustries.delete(key);
    }
    
    // Then delete the industry itself
    return this.industries.delete(id);
  }
  
  // Question-Industry relationship methods
  async addQuestionIndustry(questionId: number, industryId: number): Promise<void> {
    const key = `${questionId}-${industryId}`;
    this.questionIndustries.set(key, { questionId, industryId });
  }

  async removeQuestionIndustry(questionId: number, industryId: number): Promise<void> {
    const key = `${questionId}-${industryId}`;
    this.questionIndustries.delete(key);
  }

  async getIndustriesByQuestionId(questionId: number): Promise<Industry[]> {
    const industryIds = Array.from(this.questionIndustries.values())
      .filter(rel => rel.questionId === questionId)
      .map(rel => rel.industryId);
      
    return industryIds.map(id => this.industries.get(id)).filter(Boolean) as Industry[];
  }

  async getQuestionsByIndustryId(industryId: number): Promise<CustomQuestion[]> {
    const questionIds = Array.from(this.questionIndustries.values())
      .filter(rel => rel.industryId === industryId)
      .map(rel => rel.questionId);
      
    return questionIds.map(id => this.customQuestions.get(id)).filter(Boolean) as CustomQuestion[];
  }

  // Custom question methods
  async createCustomQuestion(question: InsertCustomQuestion): Promise<CustomQuestion> {
    const id = this.customQuestionIdCounter++;
    const now = new Date();
    const newQuestion: CustomQuestion = { 
      ...question, 
      id, 
      createdAt: now,
      category: question.category || 'assessment',
      options: question.options || []
    };
    this.customQuestions.set(id, newQuestion);
    return newQuestion;
  }
  
  async getCustomQuestion(id: number): Promise<CustomQuestion | undefined> {
    return this.customQuestions.get(id);
  }
  
  async getGlobalQuestions(): Promise<CustomQuestion[]> {
    return Array.from(this.customQuestions.values())
      .filter(question => question.category === 'global')
      .sort((a, b) => a.order - b.order);
  }
  
  async getIndustryQuestions(): Promise<CustomQuestion[]> {
    return Array.from(this.customQuestions.values())
      .filter(question => question.category === 'industry')
      .sort((a, b) => a.order - b.order);
  }
  
  async getCustomQuestionsByAssessmentId(assessmentId: number): Promise<CustomQuestion[]> {
    // Get assessment-specific questions
    const assessmentQuestions = Array.from(this.customQuestions.values())
      .filter(question => 
        question.category === 'assessment' && 
        question.assessmentId === assessmentId
      )
      .sort((a, b) => a.order - b.order);
    
    // Get global questions
    const globalQuestions = await this.getGlobalQuestions();
    
    // Get industry questions (in a real implementation, we would match against the assessment's company industry)
    const industryQuestions = await this.getIndustryQuestions();
    
    // Combine all sets
    return [...globalQuestions, ...industryQuestions, ...assessmentQuestions];
  }
  
  async updateCustomQuestion(id: number, questionData: Partial<InsertCustomQuestion>): Promise<CustomQuestion | undefined> {
    const existingQuestion = this.customQuestions.get(id);
    if (!existingQuestion) return undefined;
    
    // Preserve the existing category if not provided in the update
    if (!questionData.category) {
      questionData.category = existingQuestion.category;
    }
    
    const updatedQuestion = { ...existingQuestion, ...questionData };
    this.customQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteCustomQuestion(id: number): Promise<boolean> {
    // First delete all relationships with industries
    const keys = Array.from(this.questionIndustries.entries())
      .filter(([, rel]) => rel.questionId === id)
      .map(([key]) => key);
      
    for (const key of keys) {
      this.questionIndustries.delete(key);
    }
    
    // Then delete all responses to this question
    const responsesToDelete = Array.from(this.customQuestionResponses.values())
      .filter(response => response.questionId === id);
      
    for (const response of responsesToDelete) {
      this.customQuestionResponses.delete(response.id);
    }
    
    // Finally delete the question itself
    return this.customQuestions.delete(id);
  }
  
  // Custom question response methods
  async createCustomQuestionResponse(response: InsertCustomQuestionResponse): Promise<CustomQuestionResponse> {
    const id = this.customQuestionResponseIdCounter++;
    const now = new Date();
    const newResponse: CustomQuestionResponse = { 
      ...response, 
      id, 
      createdAt: now 
    };
    this.customQuestionResponses.set(id, newResponse);
    return newResponse;
  }
  
  async getCustomQuestionResponse(id: number): Promise<CustomQuestionResponse | undefined> {
    return this.customQuestionResponses.get(id);
  }
  
  async getCustomQuestionResponsesByQuestionId(questionId: number): Promise<CustomQuestionResponse[]> {
    return Array.from(this.customQuestionResponses.values())
      .filter(response => response.questionId === questionId);
  }
  
  async updateCustomQuestionResponse(id: number, response: Partial<InsertCustomQuestionResponse>): Promise<CustomQuestionResponse | undefined> {
    const existingResponse = this.customQuestionResponses.get(id);
    if (!existingResponse) return undefined;
    
    const updatedResponse = { ...existingResponse, ...response };
    this.customQuestionResponses.set(id, updatedResponse);
    return updatedResponse;
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
    
    // Generate token from the URL
    const token = url.split('token=')[1];
    
    // Update assessment with token and expiration
    await this.updateAssessment(id, {
      linkToken: token,
      linkExpiration: expiration
    } as any); // Use 'as any' to bypass TypeScript error for now
    
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
}

import { PostgresStorage } from './postgres-storage';

// Determine which storage implementation to use
// If DATABASE_URL is defined, use PostgreSQL, otherwise use in-memory storage
const usePostgres = process.env.DATABASE_URL !== undefined;

export const storage = usePostgres 
  ? new PostgresStorage() 
  : new MemStorage();

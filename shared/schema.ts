import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Type for any JSON data
export type Json = Record<string, any> | Array<any>;

// Assessment request schema for prospects
export const assessmentRequests = pgTable("assessment_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website"),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

export const insertAssessmentRequestSchema = createInsertSchema(assessmentRequests).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  companyName: true,
  companyWebsite: true,
  message: true,
});

export type InsertAssessmentRequest = z.infer<typeof insertAssessmentRequestSchema>;
export type AssessmentRequest = typeof assessmentRequests.$inferSelect;

// Enhanced user schema with role-based access control
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"), // Optional - we'll derive it from email
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // user, admin, manager
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  username: true, // Added username to insert schema
  active: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

// Contact information schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts)
  .extend({
    email: z.string().email("Please enter a valid email address").optional().default(""),
  })
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
  });

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Company information schema
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website").notNull(),
  address: text("address"),
  phone: text("phone"),
  primaryContact: text("primary_contact"),
  industry: text("industry"),
  employeeCount: text("employee_count"),
  locationCount: text("location_count"),
  businessHours: text("business_hours"),
  overview: text("overview"),
  compliance: jsonb("compliance"),
  growthPlans: text("growth_plans"),
  
  // Enrichment fields
  logo: text("logo"),                     // URL to company logo
  description: text("description"),       // Company description
  founded: text("founded"),               // Year company was founded
  companyType: text("company_type"),      // Public, private, non-profit, etc.
  annualRevenue: text("annual_revenue"),  // Revenue estimate
  socialProfiles: jsonb("social_profiles"), // Social media URLs
  tags: jsonb("tags"),                    // Industry tags/keywords
  enrichedAt: timestamp("enriched_at"),   // When enrichment was performed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  website: true,
  address: true,
  phone: true,
  primaryContact: true,
  industry: true,
  employeeCount: true,
  locationCount: true,
  businessHours: true,
  overview: true,
  compliance: true,
  growthPlans: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Domain reconnaissance data schema
export const domainData = pgTable("domain_data", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  domain: text("domain").notNull(),
  registrationDate: text("registration_date"),
  sslExpiry: text("ssl_expiry"),
  mxRecords: jsonb("mx_records"),
  emailSecurity: jsonb("email_security"),
  hosting: text("hosting"),
  techStack: jsonb("tech_stack"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDomainDataSchema = createInsertSchema(domainData).pick({
  companyId: true,
  domain: true,
  registrationDate: true,
  sslExpiry: true,
  mxRecords: true,
  emailSecurity: true,
  hosting: true,
  techStack: true,
});

export type InsertDomainData = z.infer<typeof insertDomainDataSchema>;
export type DomainData = typeof domainData.$inferSelect;

// Services and technology stack schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  type: text("type"),
  deployment: text("deployment"),
  licenseCount: integer("license_count"),
  primaryAdmin: text("primary_admin"),
  autoDetected: boolean("auto_detected").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  companyId: true,
  name: true,
  type: true,
  deployment: true,
  licenseCount: true,
  primaryAdmin: true,
  autoDetected: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Network assessment schema
export const networkAssessments = pgTable("network_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  method: text("method").notNull(), // 'browser', 'downloadable', 'manual'
  ipAddress: text("ip_address"),
  isp: text("isp"),
  connectionType: text("connection_type"),
  hostname: text("hostname"),
  userAgent: text("user_agent"),
  operatingSystem: text("operating_system"),
  bandwidth: integer("bandwidth"),
  bandwidthUnit: text("bandwidth_unit"),
  routerModel: text("router_model"),
  topology: text("topology"),
  deviceCounts: jsonb("device_counts"), // {workstations, servers, other}
  notes: text("notes"),
  scanData: jsonb("scan_data"), // For when the downloadable tool is used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNetworkAssessmentSchema = createInsertSchema(networkAssessments).pick({
  companyId: true,
  method: true,
  ipAddress: true,
  isp: true,
  connectionType: true,
  hostname: true,
  userAgent: true,
  operatingSystem: true,
  bandwidth: true,
  bandwidthUnit: true,
  routerModel: true,
  topology: true,
  deviceCounts: true,
  notes: true,
  scanData: true,
});

export type InsertNetworkAssessment = z.infer<typeof insertNetworkAssessmentSchema>;
export type NetworkAssessment = typeof networkAssessments.$inferSelect;

// Service costs schema
export const costs = pgTable("costs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  serviceName: text("service_name").notNull(),
  serviceProvider: text("service_provider"),
  monthlyCost: integer("monthly_cost").notNull(),
  userCount: integer("user_count"),
  renewalDate: text("renewal_date"),
  contractNotes: text("contract_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCostSchema = createInsertSchema(costs).pick({
  companyId: true,
  serviceName: true,
  serviceProvider: true,
  monthlyCost: true,
  userCount: true,
  renewalDate: true,
  contractNotes: true,
});

export type InsertCost = z.infer<typeof insertCostSchema>;
export type Cost = typeof costs.$inferSelect;

// Pain points and interests schema
export const painPoints = pgTable("pain_points", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  description: text("description"),
  priority: text("priority"), // 'critical', 'high', 'medium', 'low'
  responseTime: text("response_time"),
  interests: jsonb("interests"), // {mssp, desktop, consulting, ...}
  budget: text("budget"),
  timeline: text("timeline"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPainPointSchema = createInsertSchema(painPoints).pick({
  companyId: true,
  description: true,
  priority: true,
  responseTime: true,
  interests: true,
  budget: true,
  timeline: true,
  additionalNotes: true,
});

export type InsertPainPoint = z.infer<typeof insertPainPointSchema>;
export type PainPoint = typeof painPoints.$inferSelect;

// Complete assessment schema - ties everything together
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  referenceCode: text("reference_code").notNull().unique(),
  contactId: integer("contact_id").notNull(),
  companyId: integer("company_id").notNull(),
  domainDataId: integer("domain_data_id"),
  networkAssessmentId: integer("network_assessment_id"),
  painPointId: integer("pain_point_id"),
  securityAssessmentId: integer("security_assessment_id"),
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'archived'
  currentStep: integer("current_step").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  linkExpiration: timestamp("link_expiration"), // When the assessment link expires
  linkToken: text("link_token"), // Token for secure access without authentication
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  referenceCode: true,
  contactId: true,
  companyId: true,
  domainDataId: true,
  networkAssessmentId: true,
  painPointId: true,
  securityAssessmentId: true,
  status: true,
  currentStep: true,
  linkExpiration: true,
  linkToken: true,
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// System settings schema for storing application configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  key: true,
  value: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Scanner version schema for storing uploaded scanner tools
export const scannerVersions = pgTable("scanner_versions", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'windows' or 'mac'
  version: text("version").notNull(),
  filePath: text("file_path").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertScannerVersionSchema = createInsertSchema(scannerVersions).pick({
  platform: true,
  version: true,
  filePath: true,
  uploadedBy: true,
});

export type InsertScannerVersion = z.infer<typeof insertScannerVersionSchema>;
export type ScannerVersion = typeof scannerVersions.$inferSelect;

// Security assessment data - stores findings from domain security scans
export const securityAssessments = pgTable("security_assessments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  domain: text("domain").notNull(),
  securityScore: integer("security_score"),
  technologies: jsonb("technologies").default([]),
  exposedServices: jsonb("exposed_services").default([]),
  vulnerabilitiesHigh: integer("vulnerabilities_high").default(0),
  vulnerabilitiesMedium: integer("vulnerabilities_medium").default(0),
  vulnerabilitiesLow: integer("vulnerabilities_low").default(0),
  vulnerabilitiesInfo: integer("vulnerabilities_info").default(0),
  presentSecurityHeaders: jsonb("present_security_headers").default([]),
  missingSecurityHeaders: jsonb("missing_security_headers").default([]),
  subdomains: jsonb("subdomains").default([]),
  recommendations: jsonb("recommendations").default([]),
  scanDate: timestamp("scan_date", { mode: "date" }).defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  rawData: jsonb("raw_data"),
});

export const insertSecurityAssessmentSchema = createInsertSchema(securityAssessments).pick({
  companyId: true,
  domain: true,
  securityScore: true,
  technologies: true,
  exposedServices: true,
  vulnerabilitiesHigh: true,
  vulnerabilitiesMedium: true,
  vulnerabilitiesLow: true,
  vulnerabilitiesInfo: true,
  presentSecurityHeaders: true,
  missingSecurityHeaders: true,
  subdomains: true,
  recommendations: true,
  rawData: true,
});

export type InsertSecurityAssessment = z.infer<typeof insertSecurityAssessmentSchema>;
export type SecurityAssessment = typeof securityAssessments.$inferSelect;

// Custom questions schema
export const questionTypes = pgEnum('question_type', ['text', 'textarea', 'select', 'multiselect', 'checkbox', 'radio']);

export const customQuestions = pgTable('custom_questions', {
  id: serial('id').primaryKey(),
  assessmentId: integer('assessment_id').references(() => assessments.id).notNull(),
  question: text('question').notNull(),
  description: text('description'),
  type: questionTypes('type').notNull().default('text'),
  options: text('options').array(), // For select, multiselect, checkbox, and radio types
  required: boolean('required').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
});

export const insertCustomQuestionSchema = createInsertSchema(customQuestions, {
  options: z.array(z.string()),
  required: z.boolean(),
}).pick({
  assessmentId: true,
  question: true,
  description: true,
  type: true,
  options: true,
  required: true,
  order: true,
  createdBy: true,
});

export type InsertCustomQuestion = z.infer<typeof insertCustomQuestionSchema>;
export type CustomQuestion = typeof customQuestions.$inferSelect;

export const customQuestionResponses = pgTable('custom_question_responses', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').references(() => customQuestions.id).notNull(),
  response: text('response').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertCustomQuestionResponseSchema = createInsertSchema(customQuestionResponses, {
  response: z.array(z.string()),
}).pick({
  questionId: true,
  response: true,
});

export type InsertCustomQuestionResponse = z.infer<typeof insertCustomQuestionResponseSchema>;
export type CustomQuestionResponse = typeof customQuestionResponses.$inferSelect;

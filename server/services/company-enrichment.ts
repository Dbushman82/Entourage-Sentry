/**
 * Company Enrichment Service
 * 
 * This service coordinates company data enrichment from multiple sources
 * and provides a unified interface for the application.
 */

import { enrichCompanyByDomain as pdlEnrichCompanyByDomain } from '../utils/pdlEnrichment';
import { abstractEnrichCompanyByDomain, CompanyEnrichmentResult } from '../utils/abstractApiEnrichment';
import { PostgresStorage } from '../postgres-storage';

// API key provider types
enum EnrichmentProvider {
  PeopleDataLabs = 'peopledatalabs',
  AbstractAPI = 'abstractapi'
}

// Initialize storage for API key management
const storage = new PostgresStorage();

interface AbstractCompanyEnrichmentResponse {
  name?: string;
  domain?: string;
  year_founded?: number;
  industry?: string;
  employee_count?: number;
  locality?: string;
  country?: string;
  linkedin_url?: string;
  logo?: string;
  phone?: string;
  address?: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    country_code?: string;
  };
  has_email?: boolean;
}

// Combined enriched company data interface
export interface EnrichedCompanyData {
  name?: string;
  domain?: string;
  yearFounded?: number;
  industry?: string;
  employeeCount?: number;
  locality?: string;
  country?: string;
  linkedinUrl?: string;
  logo?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
}

export class CompanyEnrichmentService {
  private async getApiKey(): Promise<string | null> {
    try {
      // Get all API keys
      const apiKeys = await storage.getAllApiKeys();
      
      // Find the Abstract API key for company enrichment
      const abstractApiKey = apiKeys.find(key => 
        key.name.toLowerCase().includes('abstract') && 
        (key.name.toLowerCase().includes('enrich') || key.name.toLowerCase().includes('company'))
      );
      
      return abstractApiKey ? abstractApiKey.key : null;
    } catch (error) {
      console.error('[AbstractAPI] Error fetching API key:', error);
      return null;
    }
  }

  /**
   * Enriches company data using AbstractAPI's Company Enrichment API
   * @param domain The company's domain name (e.g., "acme.com")
   * @returns Enriched company data or null if enrichment failed
   */
  public async enrichCompanyByDomain(domain: string): Promise<EnrichedCompanyData | null> {
    console.log(`[CompanyEnrichment] Starting enrichment for domain: ${domain}`);
    
    try {
      // Try to enrich with Abstract API first
      const abstractApiResult = await abstractEnrichCompanyByDomain(domain);
      
      if (abstractApiResult.success && abstractApiResult.data) {
        console.log('[CompanyEnrichment] Abstract API enrichment successful');
        
        // Map the AbstractAPI data to our unified format
        const enrichedData: EnrichedCompanyData = {
          name: abstractApiResult.data.name,
          domain: domain,
          yearFounded: abstractApiResult.data.founded ? parseInt(abstractApiResult.data.founded) : undefined,
          industry: abstractApiResult.data.industry || undefined,
          employeeCount: abstractApiResult.data.employeeCount || undefined,
          logo: abstractApiResult.data.logo || undefined,
          linkedinUrl: abstractApiResult.data.socialProfiles?.linkedin
        };
        
        // Add Abstract API specific fields if available
        if (abstractApiResult.data.phone) {
          enrichedData.phone = abstractApiResult.data.phone;
        }
        
        // Add address information if available
        if (abstractApiResult.data.address) {
          const addr = abstractApiResult.data.address;
          enrichedData.streetAddress = addr.street || undefined;
          enrichedData.city = addr.city || undefined;
          enrichedData.state = addr.state || undefined;
          enrichedData.postalCode = addr.postalCode || undefined;
          enrichedData.country = addr.country || undefined;
          enrichedData.countryCode = addr.countryCode || undefined;
        }
        
        return enrichedData;
      }
      
      // If Abstract API fails, try PDL
      console.log('[CompanyEnrichment] Abstract API enrichment failed, trying PDL');
      const pdlResult = await pdlEnrichCompanyByDomain(domain);
      
      if (pdlResult.success && pdlResult.data) {
        console.log('[CompanyEnrichment] PDL enrichment successful');
        
        // Map the PDL data to our unified format
        const enrichedData: EnrichedCompanyData = {
          name: pdlResult.data.name,
          domain: pdlResult.data.website || domain,
          yearFounded: pdlResult.data.founded ? parseInt(pdlResult.data.founded) : undefined,
          industry: pdlResult.data.industry || undefined,
          employeeCount: pdlResult.data.employeeCount || undefined,
          logo: pdlResult.data.logo || undefined,
          linkedinUrl: pdlResult.data.socialProfiles?.linkedin,
          
          // Address fields from PDL
          streetAddress: pdlResult.data.streetAddress || undefined,
          city: pdlResult.data.city || undefined,
          state: pdlResult.data.state || undefined,
          postalCode: pdlResult.data.postalCode || undefined,
          country: pdlResult.data.country || undefined,
          phone: pdlResult.data.phone || undefined
        };
        
        // Log address information when available
        if (pdlResult.data.city || pdlResult.data.state || pdlResult.data.postalCode) {
          console.log('[CompanyEnrichment] PDL provided address data:', {
            street: pdlResult.data.streetAddress,
            city: pdlResult.data.city,
            state: pdlResult.data.state,
            postalCode: pdlResult.data.postalCode,
            country: pdlResult.data.country
          });
        }
        
        return enrichedData;
      }
      
      console.log('[CompanyEnrichment] All enrichment attempts failed');
      return null;
    } catch (error) {
      console.error('[CompanyEnrichment] Error during enrichment:', error);
      return null;
    }
  }
}

export const companyEnrichmentService = new CompanyEnrichmentService();
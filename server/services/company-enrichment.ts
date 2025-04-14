import axios from 'axios';
import { PostgresStorage } from '../postgres-storage';

// Initialize storage for retrieving API keys
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
        key.name.toLowerCase().includes('enrich')
      );
      
      return abstractApiKey ? abstractApiKey.key : null;
    } catch (error) {
      console.error('Error fetching Abstract API key:', error);
      return null;
    }
  }
  
  /**
   * Enriches company data using AbstractAPI's Company Enrichment API
   * @param domain The company's domain name (e.g., "acme.com")
   * @returns Enriched company data or null if enrichment failed
   */
  public async enrichCompanyByDomain(domain: string): Promise<EnrichedCompanyData | null> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        console.error('AbstractAPI Company Enrichment API key not found');
        return null;
      }
      
      // Remove any protocol prefixes if they exist
      const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      
      // Call the AbstractAPI Company Enrichment API
      const response = await axios.get<AbstractCompanyEnrichmentResponse>(
        `https://companyenrichment.abstractapi.com/v1/`,
        {
          params: {
            api_key: apiKey,
            domain: cleanDomain
          }
        }
      );
      
      const data = response.data;
      
      // Transform the response to our internal format
      const enrichedData: EnrichedCompanyData = {
        name: data.name,
        domain: data.domain,
        yearFounded: data.year_founded,
        industry: data.industry,
        employeeCount: data.employee_count,
        locality: data.locality,
        country: data.country,
        linkedinUrl: data.linkedin_url,
        logo: data.logo,
        phone: data.phone,
        // Combine address parts into a street address
        streetAddress: data.address ? 
          `${data.address.street_number || ''} ${data.address.street_name || ''}`.trim() : 
          undefined,
        city: data.address?.city,
        state: data.address?.state,
        postalCode: data.address?.postal_code,
        countryCode: data.address?.country_code
      };
      
      return enrichedData;
    } catch (error) {
      console.error('Error enriching company data:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const companyEnrichmentService = new CompanyEnrichmentService();
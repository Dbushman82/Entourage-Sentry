/**
 * AbstractAPI Company Enrichment Integration
 * 
 * Utilities for enriching company data using AbstractAPI's Company Enrichment API
 */

import axios from 'axios';
import { PostgresStorage } from '../postgres-storage';
import { CompanyEnrichmentResult } from './pdlEnrichment';

// Initialize storage for retrieving API keys
const storage = new PostgresStorage();

// AbstractAPI response interface
interface AbstractCompanyResponse {
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

/**
 * Get AbstractAPI key for company enrichment from database
 */
async function getAbstractApiKey(): Promise<string | null> {
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
 * Enrich company data using AbstractAPI by domain
 * 
 * @param domain Company domain name to lookup
 * @returns Normalized company data format
 */
export async function abstractEnrichCompanyByDomain(domain: string): Promise<CompanyEnrichmentResult> {
  try {
    const apiKey = await getAbstractApiKey();
    
    if (!apiKey) {
      console.error('[AbstractAPI] API key is not configured');
      return {
        success: false,
        error: 'AbstractAPI key not configured'
      };
    }
    
    // Normalize domain by removing protocol, www, etc.
    let normalizedDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
      
    console.log(`[AbstractAPI] Enrichment: Normalized domain from "${domain}" to "${normalizedDomain}"`);
    
    // Make the API request
    const response = await axios.get('https://companyenrichment.abstractapi.com/v1/', {
      params: {
        api_key: apiKey,
        domain: normalizedDomain
      }
    });
    
    const data = response.data as AbstractCompanyResponse;
    
    // If the API returns an empty response, consider it a failure
    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        error: 'No company data found for this domain',
        raw: data
      };
    }
    
    // Format address parts for display
    let streetAddress = '';
    if (data.address) {
      if (data.address.street_number) streetAddress += data.address.street_number + ' ';
      if (data.address.street_name) streetAddress += data.address.street_name;
      streetAddress = streetAddress.trim();
    }
    
    // Convert to our standardized format
    const result: CompanyEnrichmentResult = {
      success: true,
      data: {
        name: data.name || '',
        logo: data.logo || null,
        description: null, // AbstractAPI doesn't provide descriptions
        industry: data.industry || null,
        employeeCount: data.employee_count || null,
        founded: data.year_founded?.toString() || null,
        companyType: null, // Not provided by AbstractAPI
        annualRevenue: null, // Not provided by AbstractAPI
        socialProfiles: data.linkedin_url ? {
          linkedin: data.linkedin_url
        } : null,
        tags: null, // Not provided by AbstractAPI
        website: data.domain ? `https://${data.domain}` : null,
        // Adding AbstractAPI specific fields
        phone: data.phone || null,
        address: {
          street: streetAddress || null,
          city: data.address?.city || null,
          state: data.address?.state || null,
          postalCode: data.address?.postal_code || null,
          country: data.address?.country || null,
          countryCode: data.address?.country_code || null
        }
      },
      raw: data
    };
    
    console.log('[AbstractAPI] Enrichment success! Processed data:', JSON.stringify({
      name: result.data.name,
      industry: result.data.industry,
      phone: result.data.phone,
      address: result.data.address
    }, null, 2));
    
    return result;
  } catch (error: any) {
    console.error('[AbstractAPI] Enrichment error:', error.response?.data || error.message);
    
    // Check if this is an API error response
    if (error.response?.data) {
      return {
        success: false,
        error: `AbstractAPI error: ${error.response.data.error || 'Unknown error'}`,
        raw: error.response.data
      };
    }
    
    return {
      success: false,
      error: `Error enriching company data: ${error.message}`
    };
  }
}
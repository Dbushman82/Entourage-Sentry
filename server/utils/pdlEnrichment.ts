/**
 * People Data Labs (PDL) API Integration
 * 
 * Utilities for enriching company data using the People Data Labs API
 */

import axios from 'axios';

// PDL API configuration
const PDL_API_KEY = process.env.PEOPLE_DATA_LABS_API_KEY;
const PDL_COMPANY_ENDPOINT = 'https://api.peopledatalabs.com/v5/company/enrich';
const PDL_COMPANY_SEARCH_ENDPOINT = 'https://api.peopledatalabs.com/v5/company/search';

// Interfaces for PDL API responses
interface PDLCompanyResponse {
  status: number;
  name?: string;
  display_name?: string;
  size?: string;
  employee_count?: number;
  industry?: string;
  industry_name?: string;
  linkedin_id?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  website?: string;
  year_founded?: number;
  founded?: number;
  location?: PDLLocation;
  logo_url?: string;
  description?: string;
  tags?: string[];
  naics?: PDLNaics[];
  company_type?: string;
  revenue?: string;
  profiles?: PDLProfiles;
  likelihood?: number;
  error?: any;
}

interface PDLLocation {
  name?: string;
  locality?: string;
  region?: string;
  country?: string;
  continent?: string;
  street_address?: string;
  address_line_2?: string;
  postal_code?: string;
  geo?: string;
  metro?: string;
}

interface PDLNaics {
  name?: string;
  code?: string;
}

interface PDLProfiles {
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  github_url?: string;
}

// Interface for our standardized enrichment result
export interface CompanyEnrichmentResult {
  success: boolean;
  error?: string;
  data?: {
    name: string;
    logo: string | null;
    description: string | null;
    industry: string | null;
    employeeCount: number | null;
    founded: string | null;
    companyType: string | null;
    annualRevenue: string | null;
    socialProfiles: {
      linkedin?: string | undefined;
      twitter?: string | undefined;
      facebook?: string | undefined;
      github?: string | undefined;
    } | null;
    tags: string[] | null;
    website: string | null;
    // Address fields
    phone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  raw?: any; // Raw API response for debugging
}

/**
 * Enrich company data using PDL API by domain
 * 
 * @param domain Company domain name to lookup
 * @returns Normalized company data from PDL
 */
export async function enrichCompanyByDomain(domain: string): Promise<CompanyEnrichmentResult> {
  try {
    if (!PDL_API_KEY) {
      console.error('PDL API key is not configured');
      return {
        success: false,
        error: 'PDL API key not configured'
      };
    }

    // Normalize domain by removing protocol, www, etc.
    let normalizedDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
      
    console.log(`PDL Enrichment: Normalized domain from "${domain}" to "${normalizedDomain}"`); 

    // Make the API request
    const response = await axios.get(PDL_COMPANY_ENDPOINT, {
      params: {
        website: normalizedDomain
      },
      headers: {
        'X-Api-Key': PDL_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Convert API response to our standardized format
    return formatCompanyResponse(response.data);
  } catch (error: any) {
    console.error('PDL enrichment error:', error.response?.data || error.message);
    
    // Check if this is a PDL API error response
    if (error.response?.data) {
      return {
        success: false,
        error: `PDL API error: ${error.response.data.error?.message || 'Unknown error'}`,
        raw: error.response.data
      };
    }

    return {
      success: false,
      error: `Error enriching company data: ${error.message}`
    };
  }
}

/**
 * Enrich company data using PDL API by name
 * 
 * @param name Company name to lookup
 * @param location Optional location to improve accuracy
 * @returns Normalized company data from PDL
 */
export async function enrichCompanyByName(name: string, location?: string): Promise<CompanyEnrichmentResult> {
  try {
    if (!PDL_API_KEY) {
      return {
        success: false,
        error: 'PDL API key not configured'
      };
    }

    // Build the search query
    const searchParams: any = {
      name: name,
      size: 1 // We only need the top match
    };
    
    // Add location if provided
    if (location) {
      searchParams.location = location;
    }

    // Make the API request to search for company
    const response = await axios.post(PDL_COMPANY_SEARCH_ENDPOINT, 
      { 
        query: {
          bool: {
            must: [
              { term: { "name": name } }
            ]
          }
        },
        size: 1
      }, 
      {
        headers: {
          'X-Api-Key': PDL_API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // Check if we got valid results
    if (response.data.status === 200 && response.data.data && response.data.data.length > 0) {
      // Use the first (best) match
      return formatCompanyResponse(response.data.data[0]);
    }

    return {
      success: false,
      error: 'No matching companies found',
      raw: response.data
    };
  } catch (error: any) {
    console.error('PDL enrichment error:', error.response?.data || error.message);
    
    // Check if this is a PDL API error response
    if (error.response?.data) {
      return {
        success: false,
        error: `PDL API error: ${error.response.data.error?.message || 'Unknown error'}`,
        raw: error.response.data
      };
    }

    return {
      success: false,
      error: `Error enriching company data: ${error.message}`
    };
  }
}

/**
 * Format PDL API response to our standardized format
 * 
 * @param pdlResponse Raw PDL API response
 * @returns Normalized company data
 */
function formatCompanyResponse(pdlResponse: PDLCompanyResponse): CompanyEnrichmentResult {
  // Check if the response indicates an error
  if (pdlResponse.error || pdlResponse.status !== 200) {
    return {
      success: false,
      error: pdlResponse.error || 'Unknown PDL API error',
      raw: pdlResponse
    };
  }

  // Extract social profiles
  const socialProfiles = pdlResponse.profiles || {
    linkedin_url: pdlResponse.linkedin_url,
    facebook_url: pdlResponse.facebook_url,
    twitter_url: pdlResponse.twitter_url
  };

  // Format employee count as a range if not available directly
  let formattedEmployeeCount = null;
  if (pdlResponse.employee_count) {
    formattedEmployeeCount = pdlResponse.employee_count;
  } else if (pdlResponse.size) {
    const sizeRanges: { [key: string]: number } = {
      'small': 50,
      'medium': 250,
      'large': 1000,
      'enterprise': 5000
    };
    formattedEmployeeCount = sizeRanges[pdlResponse.size.toLowerCase()] || null;
  }

  // Create a standardized result
  const result = {
    success: true,
    data: {
      name: pdlResponse.display_name || pdlResponse.name || '',
      logo: pdlResponse.logo_url || null,
      description: pdlResponse.description || null,
      industry: pdlResponse.industry_name || pdlResponse.industry || null,
      employeeCount: formattedEmployeeCount,
      founded: pdlResponse.year_founded?.toString() || pdlResponse.founded?.toString() || null,
      companyType: pdlResponse.company_type || null,
      annualRevenue: pdlResponse.revenue || null,
      socialProfiles: socialProfiles ? {
        linkedin: socialProfiles.linkedin_url || undefined,
        twitter: socialProfiles.twitter_url || undefined,
        facebook: socialProfiles.facebook_url || undefined,
        github: socialProfiles.github_url || undefined
      } : null,
      tags: pdlResponse.tags || null,
      website: pdlResponse.website || null,
      
      // Extract location information from the PDL response
      // Extended address fields
      streetAddress: pdlResponse.location?.street_address || null,
      city: pdlResponse.location?.locality || null,
      state: pdlResponse.location?.region || null,
      postalCode: pdlResponse.location?.postal_code || null,
      country: pdlResponse.location?.country || null,
      
      // For logging purposes
      phone: null // PDL doesn't always provide phone info, we'll get it from other sources
    },
    raw: pdlResponse
  };
  
  // Log the processed data for debugging
  console.log('PDL Enrichment success! Processed data:', JSON.stringify({
    name: result.data.name,
    industry: result.data.industry,
    employeeCount: result.data.employeeCount,
    address: {
      street: result.data.streetAddress,
      city: result.data.city,
      state: result.data.state,
      postalCode: result.data.postalCode,
      country: result.data.country
    }
  }, null, 2));
  
  return result;
}

/**
 * Fallback to get a company logo using other services
 * 
 * @param domain Company domain
 * @returns URL to the company logo
 */
export function getCompanyLogo(domain: string): string {
  // Clearbit Logo API (free tier, no API key required)
  return `https://logo.clearbit.com/${domain}`;
}
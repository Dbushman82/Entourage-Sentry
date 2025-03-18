/**
 * Domain Utilities
 * 
 * Helper functions for working with domain names and web addresses
 */

/**
 * Normalizes a domain by removing protocol, www prefix, and trailing paths
 * 
 * @param url The URL or domain to normalize
 * @returns The normalized domain
 */
export function normalizeDomain(url: string): string {
  if (!url) return '';
  
  try {
    // Handle cases where the URL doesn't have a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove www. prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (error) {
    // If URL parsing fails, try a simpler approach
    const withoutProtocol = url.replace(/^https?:\/\//, '');
    const withoutWww = withoutProtocol.replace(/^www\./, '');
    const domainOnly = withoutWww.split('/')[0];
    
    return domainOnly;
  }
}

/**
 * Validates a domain format
 * 
 * @param domain The domain to validate
 * @returns Boolean indicating if the domain is valid
 */
export function isValidDomain(domain: string): boolean {
  // Regular expression for basic domain validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(normalizeDomain(domain));
}

/**
 * Ensures a URL has the proper protocol
 * 
 * @param url The URL to format
 * @returns A properly formatted URL with https:// prefix
 */
export function formatUrl(url: string): string {
  if (!url) return '';
  
  // If URL already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, add https:// prefix
  return `https://${url}`;
}

/**
 * Gets the company name suggestion from a domain
 * 
 * @param domain The domain to extract company name from
 * @returns A company name suggestion
 */
export function suggestCompanyName(domain: string): string {
  if (!domain) return '';
  
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split('.');
  const name = parts[0];
  
  // Capitalize the first letter and replace hyphens with spaces
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extracts the root domain from a full domain (e.g., example.com from subdomain.example.com)
 * 
 * @param domain The domain to extract root from
 * @returns The root domain
 */
export function getRootDomain(domain: string): string {
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split('.');
  
  // If we have a simple domain like example.com
  if (parts.length <= 2) {
    return normalizedDomain;
  }
  
  // For domains like subdomain.example.co.uk
  // This is a simplistic approach and doesn't handle all TLDs properly
  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];
  
  // Check if we might have a country code TLD like .co.uk
  if (sld.length <= 2 && parts.length > 2) {
    return `${parts[parts.length - 3]}.${sld}.${tld}`;
  }
  
  // Standard case like subdomain.example.com
  return `${sld}.${tld}`;
}

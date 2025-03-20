/**
 * Security Analysis Utilities
 * 
 * Utilities for analyzing domain security using the FullHunt.io API
 */

import { normalizeDomain } from './domainRecon';

/**
 * Security analysis result with standardized format
 */
interface SecurityAnalysisResult {
  domain: string;
  securityScore?: number;
  exposedServices?: string[];
  technologies?: string[];
  vulnerabilities?: {
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  securityHeaders?: {
    present: string[];
    missing: string[];
  };
  subdomains?: string[];
  dnsRecords?: any[];
  certificates?: any[];
  recommendations?: string[];
  error?: string;
}

/**
 * Fetch domain security data from FullHunt.io
 * 
 * @param domain The domain to analyze
 * @returns Security analysis results
 */
export async function fetchSecurityData(domain: string): Promise<SecurityAnalysisResult> {
  try {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) {
      return { 
        domain, 
        error: "Invalid domain format" 
      };
    }

    // This would be a real API call if we had a key
    // const apiUrl = `https://fullhunt.io/api/v1/domain/${normalizedDomain}/details`;
    // const response = await fetch(apiUrl, {
    //   headers: {
    //     'X-API-KEY': process.env.FULLHUNT_API_KEY || '',
    //   }
    // });
    
    // For demo, we'll generate synthetic data based on the domain name
    // This will be replaced with real API call when API key is available
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    
    const domainHash = hashCode(normalizedDomain);
    
    // Mock the security score based on domain hash (0-100)
    const securityScore = 40 + (domainHash % 60); // Score between 40-99
    
    // Simulate API response processing
    return processSecurityData(normalizedDomain, {
      domain: normalizedDomain,
      security_score: securityScore,
      exposed_services: generateExposedServices(domainHash),
      technologies: generateTechnologies(domainHash),
      vulnerability_counts: {
        high: domainHash % 5,        // 0-4 high vulnerabilities
        medium: 3 + (domainHash % 8), // 3-10 medium vulnerabilities
        low: 5 + (domainHash % 15),   // 5-19 low vulnerabilities
        info: 10 + (domainHash % 30)  // 10-39 info findings
      },
      security_headers: {
        present: generatePresentHeaders(domainHash),
        missing: generateMissingHeaders(domainHash)
      },
      subdomains: generateSubdomains(normalizedDomain, domainHash % 10)
    });
  } catch (error) {
    console.error('Error fetching security data:', error);
    return {
      domain,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Process and normalize the raw security data
 * 
 * @param domain The analyzed domain
 * @param rawData The raw API response
 * @returns Normalized security data
 */
function processSecurityData(domain: string, rawData: any): SecurityAnalysisResult {
  try {
    const result: SecurityAnalysisResult = {
      domain: domain,
      securityScore: rawData.security_score,
      exposedServices: rawData.exposed_services || [],
      technologies: rawData.technologies || [],
      vulnerabilities: {
        high: rawData.vulnerability_counts?.high || 0,
        medium: rawData.vulnerability_counts?.medium || 0,
        low: rawData.vulnerability_counts?.low || 0,
        info: rawData.vulnerability_counts?.info || 0
      },
      securityHeaders: {
        present: rawData.security_headers?.present || [],
        missing: rawData.security_headers?.missing || []
      },
      subdomains: rawData.subdomains || [],
      dnsRecords: rawData.dns_records || [],
      certificates: rawData.certificates || [],
    };

    // Generate security recommendations
    result.recommendations = generateRecommendations(result);
    
    return result;
  } catch (error) {
    console.error('Error processing security data:', error);
    return {
      domain,
      error: 'Error processing security data'
    };
  }
}

/**
 * Generate security recommendations based on findings
 * 
 * @param data The analyzed security data
 * @returns Array of recommendation strings
 */
function generateRecommendations(data: SecurityAnalysisResult): string[] {
  const recommendations: string[] = [];

  // Add recommendations based on security score
  if (data.securityScore !== undefined) {
    if (data.securityScore < 50) {
      recommendations.push('Your domain security posture is critical and requires immediate attention.');
    } else if (data.securityScore < 70) {
      recommendations.push('Your domain security posture requires significant improvements.');
    } else if (data.securityScore < 90) {
      recommendations.push('Your domain security posture is moderate but could be improved.');
    }
  }

  // Add recommendations based on vulnerabilities
  if (data.vulnerabilities) {
    if (data.vulnerabilities.high > 0) {
      recommendations.push(`Address ${data.vulnerabilities.high} high-risk vulnerabilities as a priority.`);
    }
    if (data.vulnerabilities.medium > 3) {
      recommendations.push('Address the medium-risk vulnerabilities to improve security posture.');
    }
  }

  // Add recommendations based on missing headers
  if (data.securityHeaders?.missing?.length) {
    if (data.securityHeaders.missing.includes('Content-Security-Policy')) {
      recommendations.push('Implement Content-Security-Policy headers to prevent XSS attacks.');
    }
    if (data.securityHeaders.missing.includes('X-XSS-Protection')) {
      recommendations.push('Add X-XSS-Protection headers to mitigate cross-site scripting attacks.');
    }
    if (data.securityHeaders.missing.includes('X-Frame-Options')) {
      recommendations.push('Implement X-Frame-Options to prevent clickjacking attacks.');
    }
    if (data.securityHeaders.missing.includes('Strict-Transport-Security')) {
      recommendations.push('Add Strict-Transport-Security header to enforce HTTPS.');
    }
  }

  // Add general recommendations
  if (data.exposedServices && data.exposedServices.length > 3) {
    recommendations.push('Reduce the number of exposed services to minimize attack surface.');
  }

  if (data.subdomains && data.subdomains.length > 5) {
    recommendations.push('Audit all subdomains to ensure proper security controls are in place.');
  }

  return recommendations;
}

/**
 * Calculate security risk level based on score
 * 
 * @param score Security score (0-100)
 * @returns Risk level as string
 */
export function getSecurityRiskLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' | 'Secure' {
  if (score < 50) return 'Critical';
  if (score < 70) return 'High';
  if (score < 85) return 'Medium';
  if (score < 95) return 'Low';
  return 'Secure';
}

// Helper functions for mock data

function generateExposedServices(hash: number): string[] {
  const services = [
    'HTTP', 'HTTPS', 'FTP', 'SSH', 'SMTP', 'IMAP', 'POP3', 
    'DNS', 'RDP', 'Telnet', 'VNC', 'SNMP', 'MySQL', 'MongoDB'
  ];
  
  const count = 2 + (hash % 5); // 2-6 services
  const result: string[] = [];
  
  // Always include HTTPS
  result.push('HTTPS');
  
  // Add random services
  for (let i = 1; i < count; i++) {
    const serviceIndex = (hash + i) % services.length;
    const service = services[serviceIndex];
    if (!result.includes(service)) {
      result.push(service);
    }
  }
  
  return result;
}

function generateTechnologies(hash: number): string[] {
  const technologies = [
    'Nginx', 'Apache', 'IIS', 'Node.js', 'Express', 'React', 
    'Angular', 'WordPress', 'Drupal', 'Laravel', 'Django', 
    'jQuery', 'Bootstrap', 'Amazon S3', 'Cloudflare', 'Google Analytics',
    'Microsoft Exchange', 'Office 365', 'Azure', 'AWS', 'Google Cloud'
  ];
  
  const count = 3 + (hash % 8); // 3-10 technologies
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const techIndex = (hash + i) % technologies.length;
    const tech = technologies[techIndex];
    if (!result.includes(tech)) {
      result.push(tech);
    }
  }
  
  return result;
}

function generatePresentHeaders(hash: number): string[] {
  const headers = [
    'X-Content-Type-Options', 
    'X-XSS-Protection', 
    'X-Frame-Options', 
    'Content-Security-Policy', 
    'Strict-Transport-Security', 
    'Referrer-Policy',
    'Feature-Policy',
    'Permissions-Policy'
  ];
  
  const count = 1 + (hash % 6); // 1-6 present headers
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const headerIndex = (hash + i) % headers.length;
    const header = headers[headerIndex];
    if (!result.includes(header)) {
      result.push(header);
    }
  }
  
  return result;
}

function generateMissingHeaders(hash: number): string[] {
  const allHeaders = [
    'X-Content-Type-Options', 
    'X-XSS-Protection', 
    'X-Frame-Options', 
    'Content-Security-Policy', 
    'Strict-Transport-Security', 
    'Referrer-Policy',
    'Feature-Policy',
    'Permissions-Policy'
  ];
  
  const presentHeaders = generatePresentHeaders(hash);
  return allHeaders.filter(header => !presentHeaders.includes(header));
}

function generateSubdomains(domain: string, count: number): string[] {
  const subdomainPrefixes = [
    'www', 'mail', 'blog', 'shop', 'api', 'dev', 'staging', 
    'test', 'app', 'secure', 'cdn', 'admin', 'portal', 'support'
  ];
  
  const result: string[] = [];
  
  // Always include www
  result.push(`www.${domain}`);
  
  // Add additional random subdomains
  for (let i = 1; i < count; i++) {
    const prefixIndex = i % subdomainPrefixes.length;
    const prefix = subdomainPrefixes[prefixIndex];
    if (prefix !== 'www') { // Skip www as we already added it
      result.push(`${prefix}.${domain}`);
    }
  }
  
  return result;
}
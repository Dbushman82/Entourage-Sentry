/**
 * Domain Reconnaissance Utility
 * 
 * Analyzes domain information including registration date, MX records,
 * email security, hosting info, and tech stack details
 */

// Since we can't make actual DNS lookups in this environment,
// we'll simulate the domain analysis with realistic data.
// In a production environment, you would use DNS libraries and
// external APIs to get real information.

interface DomainAnalysisResult {
  registrationDate?: string;
  sslExpiry?: string;
  mxRecords?: string[] | null;
  emailSecurity?: {
    spf?: boolean;
    dkim?: boolean;
    dmarc?: boolean;
  } | null;
  hosting?: string;
  techStack?: string[] | null;
}

export async function analyzeDomain(domain: string): Promise<DomainAnalysisResult> {
  // Normalize the domain
  const normalizedDomain = domain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

  // Simulate an API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Deterministically generate data based on the domain name
  // This ensures we get consistent results for the same domain
  const domainHash = hashCode(normalizedDomain);
  
  // Generate registration date (between 1-10 years ago)
  const yearsAgo = (domainHash % 10) + 1;
  const registrationDate = getDateYearsAgo(yearsAgo);
  
  // Generate SSL expiry (between 1-24 months in the future)
  const monthsAhead = (domainHash % 24) + 1;
  const sslExpiry = getDateMonthsAhead(monthsAhead);
  
  // Generate MX records based on domain name
  const mxRecords = generateMxRecords(normalizedDomain, domainHash);
  
  // Generate email security info
  const emailSecurity = {
    spf: (domainHash % 10) > 2, // 80% chance of having SPF
    dkim: (domainHash % 10) > 3, // 70% chance of having DKIM
    dmarc: (domainHash % 10) > 4, // 60% chance of having DMARC
  };
  
  // Generate hosting info
  const hosting = getHostingProvider(domainHash);
  
  // Generate tech stack
  const techStack = getTechStack(domainHash);
  
  return {
    registrationDate,
    sslExpiry,
    mxRecords,
    emailSecurity,
    hosting,
    techStack,
  };
}

// Helper function to generate a deterministic hash from a string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a date string for X years ago
function getDateYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

// Generate a date string for X months ahead
function getDateMonthsAhead(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

// Generate MX records based on domain name and hash
function generateMxRecords(domain: string, hash: number): string[] {
  const providers = [
    ['gmail-smtp-in.l.google.com', 'alt1.gmail-smtp-in.l.google.com', 'alt2.gmail-smtp-in.l.google.com'],
    ['mail.protection.outlook.com'],
    [`mx1.${domain}`, `mx2.${domain}`],
    ['mx.zoho.com', 'mx2.zoho.com'],
    ['mx1.mailchannels.net', 'mx2.mailchannels.net'],
  ];
  
  const providerIndex = hash % providers.length;
  return providers[providerIndex];
}

// Determine hosting provider based on hash
function getHostingProvider(hash: number): string {
  const providers = [
    'Amazon Web Services (AWS)',
    'Google Cloud Platform (GCP)',
    'Microsoft Azure',
    'DigitalOcean',
    'Heroku',
    'Cloudflare',
    'Netlify',
    'Vercel',
    'GoDaddy',
    'Bluehost'
  ];
  
  const providerIndex = hash % providers.length;
  return providers[providerIndex];
}

// Generate tech stack based on hash
function getTechStack(hash: number): string[] {
  const techStacks = [
    ['WordPress', 'PHP', 'MySQL', 'jQuery'],
    ['React', 'Node.js', 'Express', 'MongoDB'],
    ['Angular', 'ASP.NET', 'SQL Server'],
    ['Vue.js', 'Laravel', 'PostgreSQL'],
    ['Shopify', 'Liquid', 'Ruby'],
    ['WooCommerce', 'WordPress', 'PHP'],
    ['Drupal', 'PHP', 'MySQL'],
    ['Joomla', 'PHP', 'MySQL'],
    ['Magento', 'PHP', 'MySQL'],
    ['Django', 'Python', 'PostgreSQL'],
    ['Ruby on Rails', 'Ruby', 'PostgreSQL'],
    ['Spring Boot', 'Java', 'Oracle'],
  ];
  
  const stackIndex = hash % techStacks.length;
  return techStacks[stackIndex];
}

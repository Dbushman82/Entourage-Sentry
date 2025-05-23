import axios from 'axios';
import { JSDOM } from 'jsdom';

interface ScrapedCompanyInfo {
  name?: string;
  address?: string;
  // Detailed address fields
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  industry?: string;
  description?: string;
  logo?: string;
  email?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  scrapingResults?: {
    foundName: boolean;
    foundAddress: boolean;
    foundPhone: boolean;
    foundEmail: boolean;
    foundIndustry: boolean;
  };
}

// Known patterns for different types of pages/scripts that shouldn't be included in the results
const EXCLUSION_PATTERNS = [
  'wpforms_settings',
  'var ', 
  'function(', 
  'CDATA', 
  '<!DOCTYPE', 
  'wp-content',
  '{',
  '/*',
  '<script',
  '</script>',
  '.js',
  '.css',
  'window.',
  'jQuery',
  'console.log',
  'return',
  '= function',
  'object',
  'void',
  '<style',
  '!'
];

/**
 * Extracts company information from a website using JSDOM (without Puppeteer)
 * @param domain The company domain to scrape (e.g., "example.com")
 */
export async function scrapeCompanyInfo(domain: string): Promise<ScrapedCompanyInfo> {
  console.log(`Starting scraping for domain: ${domain}`);
  
  // Ensure domain is properly formatted
  const formattedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${formattedDomain}`;
  
  console.log(`Fetching page content for ${url}`);
  
  // Company info to extract
  const companyInfo: ScrapedCompanyInfo = {};
  
  try {
    // Make HTTP request to get HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    // Parse HTML content using JSDOM
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    console.log('Page loaded, extracting information...');
    
    // Extract company name (often in the title or logo alt text)
    if (!companyInfo.name) {
      // Try from title
      const siteTitle = document.title;
      if (siteTitle && siteTitle.length > 0 && !siteTitle.toLowerCase().includes('404') && !siteTitle.toLowerCase().includes('not found')) {
        // Clean up the title (remove common elements like "- Home", "| Official Site", etc.)
        companyInfo.name = siteTitle.split(/[-|]/)[0].trim();
      }
      
      // If no name yet, try from logo alt text
      if (!companyInfo.name) {
        const logoImg = document.querySelector('header img, .logo img, .site-logo img, img[alt*="logo"], img[src*="logo"]');
        if (logoImg) {
          const alt = logoImg.getAttribute('alt');
          if (alt && alt.length > 3) {
            companyInfo.name = alt.replace('logo', '').replace('Logo', '').trim();
          }
        }
      }
      
      // If still no name, try to find a prominent heading
      if (!companyInfo.name) {
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent && h1.textContent.length > 0) {
          companyInfo.name = h1.textContent.trim();
        }
      }
    }
    
    // Extract contact information directly from the homepage
    // Find phone number from tel: links
    const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
    if (telLinks.length > 0) {
      const href = telLinks[0].getAttribute('href');
      if (href) {
        companyInfo.phone = href.replace('tel:', '');
      }
    }
    
    // Find email from mailto: links
    const emailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
    if (emailLinks.length > 0) {
      const href = emailLinks[0].getAttribute('href');
      if (href) {
        companyInfo.email = href.replace('mailto:', '').split('?')[0];
      }
    }
    
    // Look for contact page to get more information
    console.log('Looking for contact page...');
    
    // Find contact page link
    const contactLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const text = a.textContent?.toLowerCase() || '';
      const href = a.getAttribute('href')?.toLowerCase() || '';
      return text.includes('contact') || href.includes('contact');
    });
    
    if (contactLinks.length > 0) {
      const contactLink = contactLinks[0];
      const contactHref = contactLink.getAttribute('href');
      
      if (contactHref) {
        // Resolve relative URL
        const contactUrl = new URL(contactHref, url).href;
        console.log(`Found contact page: ${contactUrl}`);
        
        try {
          // Fetch the contact page
          const contactResponse = await axios.get(contactUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
          });
          
          // Parse the contact page
          const contactDom = new JSDOM(contactResponse.data);
          const contactDoc = contactDom.window.document;
          
          // If we don't have a phone yet, look for phone numbers on contact page
          if (!companyInfo.phone) {
            // Look for phone patterns in text
            const contactText = contactDoc.body.textContent || '';
            const phoneMatch = contactText.match(/(\+?[0-9][\s\-\.]?)?(\(?[0-9]{3}\)?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4})/);
            if (phoneMatch) {
              companyInfo.phone = phoneMatch[0];
            }
            
            // Also check tel: links again
            const contactTelLinks = Array.from(contactDoc.querySelectorAll('a[href^="tel:"]'));
            if (contactTelLinks.length > 0) {
              const href = contactTelLinks[0].getAttribute('href');
              if (href) {
                companyInfo.phone = href.replace('tel:', '');
              }
            }
          }
          
          // If we don't have an email yet, look on contact page
          if (!companyInfo.email) {
            const contactEmailLinks = Array.from(contactDoc.querySelectorAll('a[href^="mailto:"]'));
            if (contactEmailLinks.length > 0) {
              const href = contactEmailLinks[0].getAttribute('href');
              if (href) {
                companyInfo.email = href.replace('mailto:', '').split('?')[0];
              }
            }
            
            // Try to find email pattern in text
            if (!companyInfo.email) {
              const contactText = contactDoc.body.textContent || '';
              const emailMatch = contactText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) {
                companyInfo.email = emailMatch[0];
              }
            }
          }
          
          // Look for address on contact page
          if (!companyInfo.address) {
            // Look for address elements (usually near keywords like "address", "location", etc.)
            const addressElements = Array.from(contactDoc.querySelectorAll('*')).filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              return text.includes('address') || text.includes('location') || text.includes('office');
            });
            
            if (addressElements.length > 0) {
              // Get text from the address element and its siblings
              for (const el of addressElements) {
                let addressText = el.textContent || '';
                if (addressText.toLowerCase().includes('address') || addressText.toLowerCase().includes('location')) {
                  // Get next sibling content, which might contain the actual address
                  let sibling = el.nextElementSibling;
                  while (sibling && !companyInfo.address) {
                    const siblingText = sibling.textContent?.trim() || '';
                    if (siblingText && siblingText.length > 5 && /[0-9]/.test(siblingText)) {
                      companyInfo.address = siblingText;
                      break;
                    }
                    sibling = sibling.nextElementSibling;
                  }
                  
                  // If we still don't have an address, check child elements
                  if (!companyInfo.address) {
                    const children = Array.from(el.children);
                    for (const child of children) {
                      const childText = child.textContent?.trim() || '';
                      if (childText && childText.length > 5 && /[0-9]/.test(childText) && 
                          !childText.toLowerCase().includes('address') && 
                          !childText.toLowerCase().includes('location')) {
                        companyInfo.address = childText;
                        break;
                      }
                    }
                  }
                  
                  // If still no address, try the parent container
                  if (!companyInfo.address && el.parentElement) {
                    const parentText = el.parentElement.textContent?.trim() || '';
                    const addressMatch = parentText.match(/(\d+\s+[a-zA-Z0-9\s,\.]+(?:Avenue|Ave|Boulevard|Blvd|Circle|Cir|Court|Ct|Drive|Dr|Lane|Ln|Parkway|Pkwy|Place|Pl|Plaza|Plz|Road|Rd|Square|Sq|Street|St|Terrace|Ter|Way|Wy)(?:\s+[a-zA-Z0-9\s,\.]*))/i);
                    if (addressMatch) {
                      companyInfo.address = addressMatch[0].trim();
                    }
                  }
                }
                
                // If we found an address, break the loop
                if (companyInfo.address) break;
              }
            }
            
            // If still no address, try a broader search for common address patterns
            if (!companyInfo.address) {
              const contactText = contactDoc.body.textContent || '';
              
              // Skip if contact text has WordPress code indicators
              if (!contactText.includes('wpforms_settings') && !contactText.includes('wp-content')) {
                // First try U.S. address format with street names 
                const streetAddressRegex = /(\d+\s+[a-zA-Z0-9\s,\.]+(?:Avenue|Ave|Boulevard|Blvd|Circle|Cir|Court|Ct|Drive|Dr|Lane|Ln|Parkway|Pkwy|Place|Pl|Plaza|Plz|Road|Rd|Square|Sq|Street|St|Suite|Ste|Terrace|Ter|Way|Wy)(?:\s+[a-zA-Z0-9\s,\.]*))/gi;
                const streetMatches = contactText.match(streetAddressRegex);
                if (streetMatches && streetMatches.length > 0) {
                  companyInfo.address = streetMatches[0].trim();
                }
                
                // If no street address, try number + word pattern (more general)
                if (!companyInfo.address) {
                  // Look for address pattern with number followed by text and commas (common address format)
                  const generalAddressRegex = /\d+[^.,;]*(?:,\s*[^.,;]*){1,3}/g;
                  const generalMatches = contactText.match(generalAddressRegex);
                  
                  // Filter matches to avoid false positives (like dates, phone numbers, etc.)
                  if (generalMatches && generalMatches.length > 0) {
                    // Find the longest match that's likely an address (not just numbers)
                    const possibleAddress = generalMatches
                      .filter(match => 
                        match.length > 10 && // Reasonable address length
                        /[a-zA-Z]/.test(match) && // Contains letters
                        !/^\d{2}[-.\/]\d{2}[-.\/]\d{2,4}/.test(match) && // Not a date
                        !/\d{10}/.test(match.replace(/\D/g, '')) // Not a phone number
                      )
                      .sort((a, b) => b.length - a.length)[0]; // Get longest match
                      
                    if (possibleAddress) {
                      companyInfo.address = possibleAddress.trim();
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching contact page:', error);
        }
      }
    }
    
    // Look for About page to get description and industry
    console.log('Looking for about page...');
    
    const aboutLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const text = a.textContent?.toLowerCase() || '';
      const href = a.getAttribute('href')?.toLowerCase() || '';
      return text.includes('about') || href.includes('about') || 
             text.includes('company') || href.includes('company');
    });
    
    if (aboutLinks.length > 0) {
      const aboutLink = aboutLinks[0];
      const aboutHref = aboutLink.getAttribute('href');
      
      if (aboutHref) {
        // Resolve relative URL
        const aboutUrl = new URL(aboutHref, url).href;
        console.log(`Found about page: ${aboutUrl}`);
        
        try {
          // Fetch the about page
          const aboutResponse = await axios.get(aboutUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
          });
          
          // Parse the about page
          const aboutDom = new JSDOM(aboutResponse.data);
          const aboutDoc = aboutDom.window.document;
          
          // Extract description from paragraphs
          if (!companyInfo.description) {
            const paragraphs = Array.from(aboutDoc.querySelectorAll('main p, article p, .content p, .about p, p')).filter(p => 
              p.textContent && 
              p.textContent.trim().length > 100 && 
              p.textContent.split(' ').length > 20
            );
            
            if (paragraphs.length > 0) {
              companyInfo.description = paragraphs[0].textContent?.trim() || '';
            }
          }
          
          // Try to determine industry
          if (!companyInfo.industry) {
            // Look for industry keywords
            const industryKeywords = ['industry', 'sector', 'field', 'specializing in', 'specialized in'];
            const aboutText = aboutDoc.body.textContent || '';
            
            for (const keyword of industryKeywords) {
              const pattern = new RegExp(`${keyword}[^.]{3,50}`, 'i');
              const match = aboutText.match(pattern);
              if (match) {
                let industry = match[0].replace(new RegExp(`^${keyword}`, 'i'), '').trim();
                industry = industry.replace(/^(in|:|\s|-)+/i, '').trim();
                companyInfo.industry = industry;
                break;
              }
            }
            
            // If still no industry, try infer from content
            if (!companyInfo.industry) {
              // Common industry keywords to check for
              const industryKeywordMap: Record<string, string> = {
                'technology|software|tech|app|digital|web|development|developers|programming': 'Technology & Software',
                'finance|banking|investment|insurance|financial|loan|credit|wealth|money|payment': 'Finance & Banking',
                'healthcare|health|medical|hospital|clinic|doctor|patient|care|wellness': 'Healthcare & Medical',
                'education|school|university|college|learning|teaching|student|course|academic': 'Education',
                'retail|store|shop|shopping|ecommerce|commerce|sale|product|consumer': 'Retail & E-commerce',
                'manufacturing|factory|production|industrial|industry|machinery|equipment': 'Manufacturing',
                'consulting|consultant|advisor|strategy|business solution': 'Consulting',
                'marketing|advertising|media|campaign|brand|promotion': 'Marketing & Advertising',
                'legal|law|attorney|lawyer|firm|litigation|legal service': 'Legal',
                'real estate|property|housing|mortgage|rent|lease|home': 'Real Estate',
                'construction|building|contractor|architecture|engineering': 'Construction & Engineering',
                'hospitality|hotel|restaurant|food|catering|travel|tourism': 'Hospitality & Tourism',
                'transportation|logistics|shipping|delivery|freight|supply chain': 'Transportation & Logistics',
                'energy|power|utility|oil|gas|electricity|renewable|solar|wind': 'Energy & Utilities',
                'telecommunications|telecom|network|internet|communication': 'Telecommunications',
                'it services|managed services|msp|support|security|cloud|backup': 'IT Services & Support'
              };
              
              // Check each industry pattern
              const pageText = aboutText.toLowerCase();
              
              for (const [keywordPattern, industryName] of Object.entries(industryKeywordMap)) {
                const keywords = keywordPattern.split('|');
                // Count occurrences of keywords
                let count = 0;
                for (const keyword of keywords) {
                  const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                  const matches = pageText.match(regex);
                  if (matches) {
                    count += matches.length;
                  }
                }
                
                // If more than 2 occurrences, consider it a match
                if (count >= 2) {
                  companyInfo.industry = industryName;
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching about page:', error);
        }
      }
    }
    
    // Last attempt to determine industry from homepage if still not found
    if (!companyInfo.industry) {
      const homeText = document.body.textContent || '';
      const industryKeywordMap: Record<string, string> = {
        'technology|software|tech|app|digital|web|development|developers|programming': 'Technology & Software',
        'finance|banking|investment|insurance|financial|loan|credit|wealth|money|payment': 'Finance & Banking',
        'healthcare|health|medical|hospital|clinic|doctor|patient|care|wellness': 'Healthcare & Medical',
        'education|school|university|college|learning|teaching|student|course|academic': 'Education',
        'retail|store|shop|shopping|ecommerce|commerce|sale|product|consumer': 'Retail & E-commerce',
        'manufacturing|factory|production|industrial|industry|machinery|equipment': 'Manufacturing',
        'consulting|consultant|advisor|strategy|business solution': 'Consulting',
        'marketing|advertising|media|campaign|brand|promotion': 'Marketing & Advertising',
        'legal|law|attorney|lawyer|firm|litigation|legal service': 'Legal',
        'real estate|property|housing|mortgage|rent|lease|home': 'Real Estate',
        'construction|building|contractor|architecture|engineering': 'Construction & Engineering',
        'hospitality|hotel|restaurant|food|catering|travel|tourism': 'Hospitality & Tourism',
        'it services|managed services|msp|support|security|cloud|backup': 'IT Services & Support'
      };
      
      const pageText = homeText.toLowerCase();
      
      for (const [keywordPattern, industryName] of Object.entries(industryKeywordMap)) {
        const keywords = keywordPattern.split('|');
        let count = 0;
        for (const keyword of keywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = pageText.match(regex);
          if (matches) {
            count += matches.length;
          }
        }
        
        if (count >= 2) {
          companyInfo.industry = industryName;
          break;
        }
      }
    }
    
    // Clean up any data and track what was found
    const scrapingResults = {
      foundName: !!companyInfo.name,
      foundAddress: !!companyInfo.address,
      foundPhone: !!companyInfo.phone,
      foundEmail: !!companyInfo.email,
      foundIndustry: !!companyInfo.industry
    };
    
    if (companyInfo.address) {
      // Check for script/code content
      const containsExcludedPattern = EXCLUSION_PATTERNS.some(pattern => 
        companyInfo.address?.includes(pattern)
      );
      
      // Check for invalid address patterns
      const isValidAddress = 
        companyInfo.address.length > 5 && // Reasonable minimum length
        companyInfo.address.length < 200 && // Reasonable maximum length
        /\d/.test(companyInfo.address) && // Contains at least one digit (most physical addresses do)
        /[a-zA-Z]/.test(companyInfo.address) && // Contains letters
        !companyInfo.address.includes('function(') && // Not JavaScript code
        !companyInfo.address.includes('undefined') && // Not JavaScript undefined
        !companyInfo.address.includes('NaN'); // Not JavaScript NaN
      
      if (containsExcludedPattern || !isValidAddress) {
        console.log('Address contains excluded patterns or is invalid, removing it');
        companyInfo.address = undefined;
        scrapingResults.foundAddress = false;
      } else {
        // Clean up the address if it looks valid
        // Remove any HTML tags that might be included
        companyInfo.address = companyInfo.address
          .replace(/<\/?[^>]+(>|$)/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        // Try to extract address components
        try {
          // Simple regex-based parsing for US addresses
          // Extract street address (everything before the first comma or line break)
          const streetMatch = companyInfo.address.match(/^(.*?)(?:,|\n)/);
          if (streetMatch && streetMatch[1]) {
            companyInfo.streetAddress = streetMatch[1].trim();
          }
          
          // Extract city (usually after first comma, before state)
          const cityMatch = companyInfo.address.match(/(?:,|\n)\s*([^,\n]+)(?:,|\n)/);
          if (cityMatch && cityMatch[1]) {
            companyInfo.city = cityMatch[1].trim();
          }
          
          // Extract state (2-letter code) - common US format
          const stateMatch = companyInfo.address.match(/(?:,|\n)\s*([A-Z]{2})\s+/i);
          if (stateMatch && stateMatch[1]) {
            companyInfo.state = stateMatch[1].trim();
          }
          
          // Extract postal/ZIP code (5 digits, possibly with 4-digit extension)
          const zipMatch = companyInfo.address.match(/\b(\d{5}(?:-\d{4})?)\b/);
          if (zipMatch && zipMatch[1]) {
            companyInfo.postalCode = zipMatch[1].trim();
          }
          
          // Try to extract country (usually at the end)
          const countryMatch = companyInfo.address.match(/(?:,|\n)\s*([^,\n]+)$/);
          if (countryMatch && countryMatch[1] && !countryMatch[1].match(/\d/)) {
            companyInfo.country = countryMatch[1].trim();
          } else {
            // Default to USA if format matches US address pattern
            if (companyInfo.state && companyInfo.postalCode) {
              companyInfo.country = "USA";
            }
          }
          
          console.log('Extracted address components:', {
            streetAddress: companyInfo.streetAddress,
            city: companyInfo.city,
            state: companyInfo.state,
            postalCode: companyInfo.postalCode,
            country: companyInfo.country
          });
        } catch (error) {
          console.error('Error extracting address components:', error);
        }
      }
    }
    
    // We no longer use domain-specific fallbacks for addresses
    // Instead, we'll report accurate scraping results to the user
    if (!companyInfo.address) {
      scrapingResults.foundAddress = false;
    }
    
    // Include scraping results in the returned data
    companyInfo.scrapingResults = scrapingResults;
    
    console.log('Company information extracted:', companyInfo);
    return companyInfo;
  } catch (error) {
    console.error('Error scraping website:', error);
    return {};
  }
}
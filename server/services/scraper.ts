import puppeteer from 'puppeteer';

interface ScrapedCompanyInfo {
  name?: string;
  address?: string;
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
}

/**
 * Extracts company information from a website using Puppeteer
 * @param domain The company domain to scrape (e.g., "example.com")
 */
export async function scrapeCompanyInfo(domain: string): Promise<ScrapedCompanyInfo> {
  console.log(`Starting scraping for domain: ${domain}`);
  
  // Ensure domain is properly formatted
  const formattedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${formattedDomain}`;
  
  console.log(`Opening browser for ${url}`);
  
  // Launch browser with low resource settings
  const browser = await puppeteer.launch({
    headless: true, // Use boolean instead of 'new' for compatibility
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1280,720',
    ],
  });
  
  try {
    // Company info to extract
    const companyInfo: ScrapedCompanyInfo = {};
    
    const page = await browser.newPage();
    
    // Set timeout and user agent
    await page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the website
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait for the page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Page loaded, extracting information...');
    
    // Check if site loaded properly
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Extract company name (often in the title or logo alt text)
    if (!companyInfo.name) {
      companyInfo.name = await page.evaluate(() => {
        // Try from title
        const siteTitle = document.title;
        if (siteTitle && siteTitle.length > 0 && !siteTitle.toLowerCase().includes('404') && !siteTitle.toLowerCase().includes('not found')) {
          // Clean up the title (remove common elements like "- Home", "| Official Site", etc.)
          return siteTitle.split(/[-|]/)[0].trim();
        }
        
        // Try from logo alt text
        const logoImg = document.querySelector('header img, .logo img, .site-logo img, img[alt*="logo"], img[src*="logo"]');
        if (logoImg) {
          const alt = logoImg.getAttribute('alt');
          if (alt && alt.length > 3) {
            return alt.replace('logo', '').replace('Logo', '').trim();
          }
        }
        
        // Try to find a prominent heading
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent && h1.textContent.length > 0) {
          return h1.textContent.trim();
        }
        
        return '';
      });
    }
    
    // Extract contact information by visiting the contact page
    console.log('Looking for contact page...');
    
    // Find contact page link
    const contactPageUrl = await page.evaluate(() => {
      const contactLinks = Array.from(document.querySelectorAll('a')).filter(a => {
        const text = a.textContent?.toLowerCase() || '';
        const href = a.getAttribute('href')?.toLowerCase() || '';
        return text.includes('contact') || href.includes('contact') || 
               text.includes('about') || href.includes('about');
      });
      
      if (contactLinks.length > 0) {
        // Prefer contact over about if both exist
        const contactLink = contactLinks.find(a => 
          a.textContent?.toLowerCase().includes('contact') || 
          a.getAttribute('href')?.toLowerCase().includes('contact'));
        
        if (contactLink) {
          return contactLink.getAttribute('href');
        }
        return contactLinks[0].getAttribute('href');
      }
      return null;
    });
    
    if (contactPageUrl) {
      console.log(`Found contact page: ${contactPageUrl}`);
      
      // Resolve relative URL
      const resolvedContactUrl = new URL(contactPageUrl, url).href;
      
      // Navigate to contact page
      await page.goto(resolvedContactUrl, { waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract contact details
      const contactInfo = await page.evaluate(() => {
        // Helper to find text matching a pattern near an element
        const findNearbyText = (element: Element, pattern: RegExp): string | null => {
          // Check element's own text
          if (element.textContent && pattern.test(element.textContent)) {
            return element.textContent.trim();
          }
          
          // Check siblings
          let sibling = element.nextElementSibling;
          while (sibling) {
            if (sibling.textContent && pattern.test(sibling.textContent)) {
              return sibling.textContent.trim();
            }
            sibling = sibling.nextElementSibling;
          }
          
          // Check parent's text
          if (element.parentElement?.textContent && pattern.test(element.parentElement.textContent)) {
            return element.parentElement.textContent.trim();
          }
          
          return null;
        };
        
        // Find phone number
        let phone = '';
        const phoneElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return (
            text.includes('phone') || 
            text.includes('call') || 
            text.includes('tel') ||
            /tel:/i.test(text)
          );
        });
        
        if (phoneElements.length > 0) {
          for (const el of phoneElements) {
            const potentialPhone = findNearbyText(el, /(\+?[0-9][\s\-\.]?)?(\(?[0-9]{3}\)?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4})/);
            if (potentialPhone) {
              // Extract just the phone number using regex
              const match = potentialPhone.match(/(\+?[0-9][\s\-\.]?)?(\(?[0-9]{3}\)?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4})/);
              if (match) {
                phone = match[0];
                break;
              }
            }
          }
        }
        
        // If still no phone, look for tel: links
        if (!phone) {
          const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
          if (telLinks.length > 0) {
            const href = telLinks[0].getAttribute('href');
            if (href) {
              phone = href.replace('tel:', '');
            }
          }
        }
        
        // Find address
        let address = '';
        const addressElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return (
            text.includes('address') || 
            text.includes('location') || 
            text.includes('headquarters') ||
            text.includes('hq') ||
            text.includes('office')
          );
        });
        
        if (addressElements.length > 0) {
          for (const el of addressElements) {
            const potentialAddress = findNearbyText(el, /[0-9]+[\s\,]+[A-Za-z\s\,]+[\s\,]+[A-Za-z]{2}[\s\,]+[0-9]{5}/);
            if (potentialAddress) {
              address = potentialAddress;
              break;
            }
          }
        }
        
        // If still no address, look for address patterns directly
        if (!address) {
          const allTextNodes = document.evaluate('//text()', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < allTextNodes.snapshotLength; i++) {
            const textNode = allTextNodes.snapshotItem(i);
            if (textNode && textNode.textContent) {
              const text = textNode.textContent.trim();
              // Look for common address patterns
              if (
                /^\d+\s[A-Za-z\s\,]+,\s[A-Za-z\s\,]+,\s[A-Za-z]{2}\s\d{5}/.test(text) ||
                /^\d+\s[A-Za-z\s]+\s(Street|Avenue|Road|Blvd|Lane|Drive|Way|Place|Court|Plaza),\s[A-Za-z\s\,]+/.test(text)
              ) {
                address = text;
                break;
              }
            }
          }
        }
        
        // Find email
        let email = '';
        const emailElements = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
        if (emailElements.length > 0) {
          const href = emailElements[0].getAttribute('href');
          if (href) {
            email = href.replace('mailto:', '').split('?')[0];
          }
        }
        
        // If no direct mailto links, look for text with email patterns
        if (!email) {
          const allText = document.body.innerText;
          const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            email = emailMatch[0];
          }
        }
        
        return { phone, address, email };
      });
      
      // Add the contact info to our results
      if (contactInfo.phone) companyInfo.phone = contactInfo.phone;
      if (contactInfo.address) companyInfo.address = contactInfo.address;
      if (contactInfo.email) companyInfo.email = contactInfo.email;
    }
    
    // Look for About page to get company description and industry
    console.log('Looking for about page...');
    
    // Go back to homepage
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find about page link
    const aboutPageUrl = await page.evaluate(() => {
      const aboutLinks = Array.from(document.querySelectorAll('a')).filter(a => {
        const text = a.textContent?.toLowerCase() || '';
        const href = a.getAttribute('href')?.toLowerCase() || '';
        return text.includes('about') || href.includes('about') || 
               text.includes('company') || href.includes('company');
      });
      
      if (aboutLinks.length > 0) {
        return aboutLinks[0].getAttribute('href');
      }
      return null;
    });
    
    if (aboutPageUrl) {
      console.log(`Found about page: ${aboutPageUrl}`);
      
      // Resolve relative URL
      const resolvedAboutUrl = new URL(aboutPageUrl, url).href;
      
      // Navigate to about page
      await page.goto(resolvedAboutUrl, { waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract company description and industry
      const aboutInfo = await page.evaluate(() => {
        // Look for company description (usually the first paragraph on the about page)
        let description = '';
        const paragraphs = Array.from(document.querySelectorAll('main p, article p, .content p, .about p, p')).filter(p => 
          p.textContent && 
          p.textContent.trim().length > 100 && 
          p.textContent.split(' ').length > 20
        );
        
        if (paragraphs.length > 0) {
          description = paragraphs[0].textContent?.trim() || '';
        }
        
        // Look for industry (may be mentioned with keywords)
        let industry = '';
        const industryKeywords = ['industry', 'sector', 'field', 'specializing in', 'specialized in'];
        
        // Check text for industry indicators
        const allText = document.body.innerText;
        for (const keyword of industryKeywords) {
          const pattern = new RegExp(`${keyword}[^.]{3,50}`, 'i');
          const match = allText.match(pattern);
          if (match) {
            industry = match[0].replace(new RegExp(`^${keyword}`, 'i'), '').trim();
            industry = industry.replace(/^(in|:|\s|-)+/i, '').trim();
            break;
          }
        }
        
        return { description, industry };
      });
      
      // Add the about info to our results
      if (aboutInfo.description) companyInfo.description = aboutInfo.description;
      if (aboutInfo.industry) companyInfo.industry = aboutInfo.industry;
    }
    
    // If we still don't have an industry, try to infer it from the content
    if (!companyInfo.industry) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      companyInfo.industry = await page.evaluate(() => {
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
          'agriculture|farming|farm|crop|food production|livestock': 'Agriculture',
          'automotive|vehicle|car|truck|auto|parts|dealer|repair': 'Automotive',
          'entertainment|media|film|music|game|streaming': 'Entertainment & Media',
          'nonprofit|foundation|charity|organization|community': 'Non-profit',
          'security|protection|defense|surveillance': 'Security',
          'pharmaceutical|pharma|drug|biotech|medication': 'Pharmaceutical',
          'aerospace|aviation|aircraft|space|airline': 'Aerospace & Aviation'
        };
        
        // Get all text from the page
        const pageText = document.body.innerText.toLowerCase();
        
        // Check each industry pattern
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
          
          // If more than 3 occurrences, consider it a match
          if (count >= 3) {
            return industryName;
          }
        }
        
        return '';
      });
    }
    
    console.log('Company information extracted:', companyInfo);
    return companyInfo;
  } catch (error) {
    console.error('Error scraping website:', error);
    return {};
  } finally {
    console.log('Closing browser');
    await browser.close();
  }
}
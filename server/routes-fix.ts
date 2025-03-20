  // Domain enrichment endpoint with improved response format
  app.post('/api/companies/enrich/domain', async (req: Request, res: Response) => {
    try {
      const { domain, companyId } = req.body;
      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }
      
      console.log('[PDL] Starting company enrichment for domain:', domain);
      
      // First, analyze the domain for technical details
      const domainReconData = await analyzeDomain(domain);
      console.log('[PDL] Domain analysis complete for', domain);
      
      // Normalize domain for PDL API
      const normalizedDomain = domain.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      console.log('[PDL] Using normalized domain for PDL API:', normalizedDomain);
      
      // Get enrichment data from PDL API
      const enrichmentData = await enrichCompanyByDomain(normalizedDomain);
      
      console.log('[PDL] Enrichment result:', 
        enrichmentData.success ? 'Success' : 'Failed', 
        enrichmentData.error || '');
        
      if (enrichmentData.success && enrichmentData.data) {
        console.log('[PDL] Received data:', JSON.stringify({
          name: enrichmentData.data.name,
          industry: enrichmentData.data.industry,
          employeeCount: enrichmentData.data.employeeCount,
          founded: enrichmentData.data.founded
        }, null, 2));
      }
      
      // Prepare the complete response object
      const responseData = {
        domain,
        domainData: domainReconData,
        enrichment: enrichmentData,
      };
      
      // If companyId is provided, update the company with the enriched data
      if (companyId && enrichmentData.success && enrichmentData.data) {
        const companyIdNum = parseInt(companyId);
        if (isNaN(companyIdNum)) {
          return res.status(400).json({ error: 'Invalid company ID' });
        }
        
        const company = await storage.getCompany(companyIdNum);
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        // Update the company with enriched data
        const enrichedCompanyData: any = {
          logo: enrichmentData.data.logo,
          description: enrichmentData.data.description,
          industry: enrichmentData.data.industry || company.industry,
          employeeCount: enrichmentData.data.employeeCount?.toString() || company.employeeCount,
          founded: enrichmentData.data.founded,
          companyType: enrichmentData.data.companyType,
          annualRevenue: enrichmentData.data.annualRevenue,
          socialProfiles: enrichmentData.data.socialProfiles ? JSON.stringify(enrichmentData.data.socialProfiles) : null,
          tags: enrichmentData.data.tags ? JSON.stringify(enrichmentData.data.tags) : null,
          enrichedAt: new Date().toISOString()
        };
        
        // Remove undefined/null properties
        Object.keys(enrichedCompanyData).forEach(key => {
          if (enrichedCompanyData[key] === undefined || enrichedCompanyData[key] === null) {
            delete enrichedCompanyData[key];
          }
        });
        
        if (Object.keys(enrichedCompanyData).length > 0) {
          const updatedCompany = await storage.updateCompany(companyIdNum, enrichedCompanyData);
          responseData.company = updatedCompany;
        }
      }
      
      // Return the complete response with all data
      res.json(responseData);
    } catch (error) {
      console.error('[PDL] Error in domain enrichment:', error);
      res.status(500).json({ 
        error: 'Error processing enrichment', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
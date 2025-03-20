  // Function to fetch domain enrichment data directly
  const fetchDomainEnrichment = async (domain: string) => {
    if (!domain) return;

    try {
      setIsEnriching(true);
      console.log("Fetching enrichment for domain:", domain);
      
      // Normalize the domain before sending to API
      const normalizedDomain = domain.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      
      // Make the API request
      const response = await apiRequest('POST', '/api/companies/enrich/domain', { domain: normalizedDomain });
      const data = await response.json();
      
      console.log("Domain enrichment API response:", data);
      
      // Set both the domain data and enrichment data
      setDomainData(data.domainData);
      setEnrichmentData(data);
      
      // Apply the enrichment data to form fields if available
      if (data.enrichment?.success && data.enrichment?.data) {
        const enrichedData = data.enrichment.data;
        
        // Update form fields with enriched data
        console.log("Applying enriched data to form:", enrichedData);
        
        // Update company name if valid and form value is empty or auto-suggested
        if (enrichedData.name && 
            (!form.getValues('name') || form.getValues('name') === suggestCompanyName(normalizedDomain))) {
          form.setValue('name', enrichedData.name, { shouldDirty: true, shouldValidate: true });
        }
        
        // Try to update other fields if available
        if (enrichedData.industry) {
          form.setValue('industry', enrichedData.industry, { shouldDirty: true });
        }
        
        if (enrichedData.employeeCount) {
          form.setValue('employeeCount', String(enrichedData.employeeCount), { shouldDirty: true });
        }
        
        toast({
          title: "Company data enriched",
          description: "Additional company information has been found"
        });
      }
      
      setIsEnriching(false);
    } catch (error) {
      console.error("Enrichment error:", error);
      setIsEnriching(false);
      toast({
        title: "Enrichment failed",
        description: error instanceof Error ? error.message : "Could not enrich company data",
        variant: "destructive"
      });
    }
  };
  
  // Helper function to suggest company name from domain
  const suggestCompanyName = (domain: string): string => {
    if (!domain) return '';
    
    const parts = domain.split('.');
    if (parts.length === 0) return '';
    
    // Capitalize the first part of the domain
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };
  
  // Start enrichment automatically when website field changes
  useEffect(() => {
    const websiteValue = form.getValues('website');
    if (websiteValue && !isEnriching && !enrichmentData) {
      fetchDomainEnrichment(websiteValue);
    }
  }, [form.getValues('website')]);
  
  // Apply enrichment data to form fields when it becomes available
  useEffect(() => {
    if (enrichmentData?.enrichment?.success && enrichmentData?.enrichment?.data) {
      const data = enrichmentData.enrichment.data;
      console.log("Applying enrichment data to form:", data);
      
      // Only update fields if they have values and current form values are empty or default
      if (data.name) {
        const currentName = form.getValues('name');
        const websiteValue = form.getValues('website');
        const suggestedName = suggestCompanyName(websiteValue);
        
        if (!currentName || currentName === suggestedName) {
          form.setValue('name', data.name, { shouldDirty: true });
        }
      }
      
      // Set industry if available and form value is empty
      if (data.industry && !form.getValues('industry')) {
        form.setValue('industry', data.industry, { shouldDirty: true });
      }
      
      // Set employee count if available and form value is empty
      if (data.employeeCount && !form.getValues('employeeCount')) {
        form.setValue('employeeCount', String(data.employeeCount), { shouldDirty: true });
      }
    }
  }, [enrichmentData]);
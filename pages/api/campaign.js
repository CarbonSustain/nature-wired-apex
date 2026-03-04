const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
export const handleCreateCampaign = async (formData) => {
    try {
      // If you need to send a file, use FormData:
      const data = new FormData();
      data.append('name', formData.name);
      data.append('votingStyle', formData.votingStyle);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('emailSubject', formData.emailSubject || '');
      data.append('emailBody', formData.emailBody || '');
      data.append('departmentIds', JSON.stringify(formData.departmentIds || [])); // Required by backend
      // Remove CampaignProject field - backend needs to handle this differently
      if (formData.file) data.append('file', formData.file);
      
      // Debug: print FormData content and type
      for (let pair of data.entries()) {
        console.log('FormData:', pair[0], pair[1], 'type:', typeof pair[1], pair[1] instanceof File ? 'File' : '');
      }

      const response = await fetch(`${API_BASE}/campaign`, {
        method: 'POST',
        body: data,
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  export const handleGetallCampaign = async () => {
    try {
      const response = await fetch(`${API_BASE}/campaign`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  };

  export const handleAddProjectsToCampaign = async (campaignId, projectIds) => {
    try {
      console.log('🔗 Adding projects to campaign:', { campaignId, projectIds });
      
      const response = await fetch(`${API_BASE}/campaign-project/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          campaignId: parseInt(campaignId),
          projectIds: projectIds.map(Number)
        }),
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Successfully added projects:', result);
        return result;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to add projects:', response.status, errorText);
        throw new Error(`Failed to add projects: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error adding projects to campaign:', error);
      throw error;
    }
  };

  export const sendCampaignEmails = async (campaignId, emailSubject, emailBody) => {
    try {
      console.log('📧 Sending campaign emails:', { campaignId, emailSubject, emailBody });
      
      const response = await fetch(`${API_BASE}/send-emails/campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: parseInt(campaignId),
          emailSubject: emailSubject,
          emailBody: emailBody
        }),
      });
      
      console.log('📡 Email response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Emails sent successfully:', result);
        return result;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send emails:', response.status, errorText);
        throw new Error(`Failed to send emails: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error sending campaign emails:', error);
      throw error;
    }
  };
  
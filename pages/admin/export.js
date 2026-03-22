import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { handleGetallCampaign } from "../api/campaign";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getUserId } from "@/utils/api";

export default function ExportPage() {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [exportFormat, setExportFormat] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Fetch real campaigns from database
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await handleGetallCampaign();
        setCampaigns(res.data || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleExport = async () => {
    if (!selectedCampaign || !exportFormat) {
      alert("Please select both a campaign and export format ");
      return;
    }

    setIsLoading(true);
    try {
      const selectedCampaignData = campaigns.find(c => c.id === parseInt(selectedCampaign));
      if (!selectedCampaignData) throw new Error("Campaign not found");

      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const userId = await getUserId();

      // Fetch comprehensive campaign data
      const [
        campaignResponse,
        votingResponse,
        blockchainResponse,
        projectsResponse,
        departmentsResponse,
        statusResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/campaign/${selectedCampaign}`),
        fetch(`${API_BASE}/vote/campaign-votes/${selectedCampaign}?userId=${userId}`),
        fetch(`${API_BASE}/vote/hedera/${selectedCampaign}?userId=${userId}`),
        fetch(`${API_BASE}/project`),
        fetch(`${API_BASE}/department`),
        fetch(`${API_BASE}/campaign-status`),
      ]);

      // Parse responses
      const campaignData = await campaignResponse.json();
      const votingData = votingResponse.ok ? await votingResponse.json() : null;
      const blockchainData = blockchainResponse.ok ? await blockchainResponse.json() : null;
      const projectsData = projectsResponse.ok ? await projectsResponse.json() : null;
      const departmentsData = departmentsResponse.ok ? await departmentsResponse.json() : null;
      const statusData = statusResponse.ok ? await statusResponse.json() : null;

      // Get the specific campaign data
      const campaign = campaignData.data || campaignData;

      // Map campaign status ID to status name
      let campaignStatus = null;
      if (statusData && statusData.data && Array.isArray(statusData.data) && campaign.campaignStatusId) {
        const statusMap = {};
        statusData.data.forEach(status => {
          statusMap[status.id] = status;
        });
        campaignStatus = statusMap[campaign.campaignStatusId];
      }

      // Enrich campaign data with status information
      const enrichedCampaign = {
        ...campaign,
        campaignStatus: campaignStatus,
      };

      // Process voting data for metrics
      const votes = votingData?.data?.votes || [];
      const uniqueVoters = new Set(votes.map(v => v.user.id));
      const projectVoteCounts = {};

      votes.forEach(vote => {
        const projectId = vote.project.id;
        projectVoteCounts[projectId] = (projectVoteCounts[projectId] || 0) + 1;
      });

      // Get top 3 projects by votes
      const topProjects = Object.entries(projectVoteCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([projectId, voteCount]) => {
          const project = projectsData?.data?.find(p => p.id === parseInt(projectId));
          return {
            id: projectId,
            name: project?.projectName || `Project ${projectId}`,
            votes: voteCount,
            description: project?.description || "No description available",
          };
        });

      // Process blockchain data
      const blockchainVotes = blockchainData?.data?.votes || [];
      const verifiedVoteCount = blockchainVotes.length;

      // Create comprehensive export data with report structure
      const exportData = {
        campaign: enrichedCampaign,
        voting: votingData?.data || null,
        blockchain: blockchainData?.data || null,
        projects: projectsData?.data || [],
        departments: departmentsData?.data || [],
        reportMetrics: {
          totalVotes: votes.length,
          uniqueVoters: uniqueVoters.size,
          totalProjects: projectsData?.data?.length || 0,
          verifiedVotes: verifiedVoteCount,
          participationRate: uniqueVoters.size > 0 ? Math.round((uniqueVoters.size / 100) * 100) : 0,
          topProjects: topProjects,
        },
        exportMetadata: {
          exportDate: new Date().toISOString(),
          campaignId: selectedCampaign,
          format: exportFormat,
          dataVersion: "2.0",
          reportType: "comprehensive_campaign_report",
        },
      };

      if (exportFormat === "JSON") {
        // Handle JSON export directly in frontend
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign_${selectedCampaign}_comprehensive_report.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (exportFormat === "CSV") {
        // Handle CSV export directly in frontend
        const csvData = generateCSV(exportData);
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign_${selectedCampaign}_comprehensive_report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (exportFormat === "PDF") {
        // Handle PDF export directly in frontend
        generatePDF(exportData);
      } else if (exportFormat === "PPTX") {
        // Handle PowerPoint export directly in frontend
        await generatePowerPoint(exportData);
      } else {
        // For other formats, use backend API
        console.log("Sending export request with format:", exportFormat);
        const response = await fetch(`${API_BASE}/campaign-export/export/${selectedCampaign}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            format: exportFormat,
            comprehensiveData: exportData,
          }),
        });

        if (!response.ok) {
          throw new Error("Export failed");
        }

        // Try to get filename from Content-Disposition header
        let filename = `campaign_${selectedCampaign}_report.${exportFormat.toLowerCase()}`;
        const disposition = response.headers.get("content-disposition");
        if (disposition && disposition.includes("filename=")) {
          filename = disposition.split("filename=")[1].replace(/"/g, "");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export campaign data. Please make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCSV = data => {
    const csvRows = [];

    // Report Header
    csvRows.push(["NATURE BACKERS CAMPAIGN REPORT"]);
    csvRows.push([]);

    // Executive Summary
    csvRows.push(["EXECUTIVE SUMMARY"]);
    csvRows.push(["Employees Engaged", "Votes Cast", "Verified Projects", "Participation Rate", "Total Projects"]);
    csvRows.push([
      data.reportMetrics.uniqueVoters,
      data.reportMetrics.totalVotes,
      data.reportMetrics.verifiedVotes,
      `${data.reportMetrics.participationRate}%`,
      data.reportMetrics.totalProjects,
    ]);
    csvRows.push([]);

    // Campaign Summary
    csvRows.push(["CAMPAIGN SUMMARY"]);
    csvRows.push([
      "Campaign ID",
      "Name",
      "Voting Style",
      "Status",
      "Start Date",
      "End Date",
      "Created At",
      "Updated At",
      "Email Subject",
      "Email Body",
      "Campaign URL",
      "Transaction Hash",
    ]);
    csvRows.push([
      data.campaign.id,
      data.campaign.name,
      data.campaign.votingStyle || "",
      data.campaign.campaignStatus?.name || "Unknown",
      data.campaign.startDate,
      data.campaign.endDate,
      data.campaign.createdAt,
      data.campaign.updatedAt,
      data.campaign.emailSubject || "",
      data.campaign.emailBody || "",
      data.campaign.url || "",
      data.campaign.tx_hash || "",
    ]);
    csvRows.push([]);

    // Voting Summary
    if (data.voting) {
      csvRows.push(["VOTING SUMMARY"]);
      csvRows.push(["Total Votes", "Campaign Name", "Campaign ID"]);
      csvRows.push([data.voting.totalVotes || 0, data.voting.campaign?.name || "", data.voting.campaign?.id || ""]);
      csvRows.push([]);

      // Individual Votes
      if (data.voting.votes && data.voting.votes.length > 0) {
        csvRows.push(["INDIVIDUAL VOTES"]);
        csvRows.push([
          "Vote ID",
          "User ID",
          "User Name",
          "User Email",
          "Project ID",
          "Project Name",
          "Voting Reason",
          "Vote Hash",
          "Created At",
        ]);

        data.voting.votes.forEach(vote => {
          const projectName =
            data.projects.find(p => p.id === vote.project.id)?.projectName || vote.project.projectName || "";
          csvRows.push([
            vote.id,
            vote.user.id,
            `${vote.user.first_name} ${vote.user.last_name}`,
            vote.user.business_email,
            vote.project.id,
            projectName,
            vote.voteData.reason,
            vote.vote_hash,
            vote.createdAt,
          ]);
        });
        csvRows.push([]);
      }
    }

    // Blockchain Data
    if (data.blockchain) {
      csvRows.push(["BLOCKCHAIN VERIFICATION"]);
      csvRows.push(["Message", "Vote Count"]);
      csvRows.push([data.blockchain.message || "", data.blockchain.voteCount || 0]);
      csvRows.push([]);

      if (data.blockchain.votes && data.blockchain.votes.length > 0) {
        csvRows.push(["BLOCKCHAIN VOTES"]);
        csvRows.push([
          "Vote ID",
          "User Name",
          "User Email",
          "Vote Option",
          "Project ID",
          "Project Name",
          "Voting Reason",
          "Voter Address",
          "Created At",
        ]);

        data.blockchain.votes.forEach(vote => {
          const projectName = data.projects.find(p => p.id === vote.projectId)?.projectName || vote.projectName || "";
          csvRows.push([
            vote.voteId,
            vote.userName,
            vote.email,
            vote.voteOption,
            vote.projectId,
            projectName,
            vote.reason,
            vote.voterAddress,
            vote.createdAt,
          ]);
        });
        csvRows.push([]);
      }
    }

    // Campaign Departments
    if (data.campaign.CampaignDepartment && data.campaign.CampaignDepartment.length > 0) {
      csvRows.push(["CAMPAIGN DEPARTMENTS"]);
      csvRows.push(["Department ID", "Department Name", "Created At"]);
      data.campaign.CampaignDepartment.forEach(dept => {
        csvRows.push([dept.departmentId, dept.department?.name || `Department ${dept.departmentId}`, dept.createdAt]);
      });
      csvRows.push([]);
    }

    // Campaign Projects
    if (data.campaign.CampaignProject && data.campaign.CampaignProject.length > 0) {
      csvRows.push(["CAMPAIGN PROJECTS"]);
      csvRows.push(["Project ID", "Project Name", "Added At"]);
      data.campaign.CampaignProject.forEach(proj => {
        const projectName =
          data.projects.find(p => p.id === proj.projectId)?.projectName || `Project ${proj.projectId}`;
        csvRows.push([proj.projectId, projectName, proj.createdAt]);
      });
      csvRows.push([]);
    }

    // Campaign Vote Hashes
    if (data.campaign.votes && data.campaign.votes.length > 0) {
      csvRows.push(["CAMPAIGN VOTE HASHES"]);
      csvRows.push(["Vote ID", "Vote Hash"]);
      data.campaign.votes.forEach(vote => {
        csvRows.push([vote.id, vote.vote_hash || "N/A"]);
      });
      csvRows.push([]);
    }

    // Top 3 Projects by Votes
    if (data.reportMetrics.topProjects && data.reportMetrics.topProjects.length > 0) {
      csvRows.push(["TOP 3 PROJECTS BY VOTES"]);
      csvRows.push(["Rank", "Project Title", "Project ID", "Votes", "Description"]);
      data.reportMetrics.topProjects.forEach((project, index) => {
        csvRows.push([`#${index + 1}`, project.name, project.id, project.votes, project.description]);
      });
      csvRows.push([]);
    }

    // Export Metadata
    csvRows.push(["EXPORT METADATA"]);
    csvRows.push(["Export Date", "Campaign ID", "Format", "Data Version"]);
    csvRows.push([
      data.exportMetadata.exportDate,
      data.exportMetadata.campaignId,
      data.exportMetadata.format,
      data.exportMetadata.dataVersion,
    ]);

    return csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  };

  const generatePDF = data => {
    const doc = new jsPDF();
    let yPosition = 45; // Start content below header
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 35; // Height reserved for header

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * 7;
    };

    // Helper function to add section header
    const addSectionHeader = (text, y) => {
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(text, margin, y);
      return y + 12; // Reduced spacing after section headers
    };

    // Helper function to add label-value pair
    const addLabelValue = (label, value, y) => {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${label}:`, margin, y);

      doc.setFont(undefined, "normal");
      const valueText = value || "N/A";
      const newY = addWrappedText(valueText, margin + 50, y, contentWidth - 50);
      return Math.max(newY, y + 8); // Reduced minimum spacing between lines
    };

    // Helper function to check and add new page if needed
    const checkAndAddPage = (currentY, pageNum) => {
      if (currentY > 250) {
        doc.addPage();
        addHeader(pageNum);
        return 45; // Start content below header
      }
      return currentY;
    };

    // Function to add header to any page
    const addHeader = pageNum => {
      // Add a header background
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      // Add the title (moved left to avoid logo overlap)
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Nature Backers Campaign Report", margin, 22);

      // Add Nature Wired logo image on the far right (smaller size)
      try {
        const logoUrl = "/naturewired-logo.png";
        doc.addImage(logoUrl, "PNG", pageWidth - margin - 40, 10, 25, 12);
      } catch (error) {
        // Fallback to text logo if image fails to load
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.setTextColor(34, 139, 34); // Green color for NATURE
        doc.text("NATURE", pageWidth - margin - 50, 17);

        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.setTextColor(72, 187, 120); // Teal color for WIRED
        doc.text("WIRED", pageWidth - margin - 50, 22);

        // Add a subtle border around the logo text
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(pageWidth - margin - 55, 15, 40, 12);

        // Add a decorative line above the logo
        doc.setDrawColor(34, 139, 34);
        doc.setLineWidth(1);
        doc.line(pageWidth - margin - 55, 17, pageWidth - margin - 10, 17);
      }

      // Add a subtle line under the header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, headerHeight - 3, pageWidth - margin, headerHeight - 3);
    };

    // Add header to first page
    addHeader(1);

    // Campaign Info
    yPosition = addSectionHeader("Campaign Information", yPosition);
    yPosition = addLabelValue("Campaign Name", data.campaign.name, yPosition);
    yPosition = addLabelValue("Campaign ID", data.campaign.id, yPosition);
    yPosition = addLabelValue("Voting Style", data.campaign.votingStyle || "N/A", yPosition);
    yPosition = addLabelValue("Status", data.campaign.campaignStatus?.name || "Unknown", yPosition);
    yPosition = addLabelValue("Start Date", new Date(data.campaign.startDate).toLocaleString(), yPosition);
    yPosition = addLabelValue("End Date", new Date(data.campaign.endDate).toLocaleString(), yPosition);
    yPosition = addLabelValue("Created", new Date(data.campaign.createdAt).toLocaleString(), yPosition);
    yPosition = addLabelValue("Updated", new Date(data.campaign.updatedAt).toLocaleString(), yPosition);
    yPosition = addLabelValue("Email Subject", data.campaign.emailSubject || "N/A", yPosition);
    yPosition = addLabelValue("Email Body", data.campaign.emailBody || "N/A", yPosition);
    yPosition = addLabelValue("Campaign URL", data.campaign.url || "N/A", yPosition);
    yPosition = addLabelValue("Transaction Hash", data.campaign.tx_hash || "N/A", yPosition);
    yPosition += 10;

    // Executive Summary
    yPosition = addSectionHeader("Executive Summary", yPosition);
    yPosition = addLabelValue("Employees Engaged", data.reportMetrics.uniqueVoters, yPosition);
    yPosition = addLabelValue("Votes Cast", data.reportMetrics.totalVotes, yPosition);
    yPosition = addLabelValue("Verified Projects", data.reportMetrics.verifiedVotes, yPosition);
    yPosition = addLabelValue("Participation Rate", `${data.reportMetrics.participationRate}%`, yPosition);
    yPosition = addLabelValue("Total Projects", data.reportMetrics.totalProjects, yPosition);
    yPosition += 6; // Reduced spacing after executive summary

    // Campaign Departments
    if (data.campaign.CampaignDepartment && data.campaign.CampaignDepartment.length > 0) {
      yPosition = addSectionHeader("Campaign Departments", yPosition);
      data.campaign.CampaignDepartment.forEach((dept, index) => {
        yPosition = addLabelValue(
          `Department ${index + 1}`,
          dept.department?.name || `Department ${dept.departmentId}`,
          yPosition
        );
      });
      yPosition += 10;
    }

    // Campaign Projects
    if (data.campaign.CampaignProject && data.campaign.CampaignProject.length > 0) {
      yPosition = checkAndAddPage(yPosition, 2);
      yPosition = addSectionHeader("Campaign Projects", yPosition);
      data.campaign.CampaignProject.forEach((proj, index) => {
        yPosition = checkAndAddPage(yPosition, 2);
        const projectName =
          data.projects.find(p => p.id === proj.projectId)?.projectName || `Project ${proj.projectId}`;
        yPosition = addLabelValue(`Project ${index + 1}`, projectName, yPosition);
        yPosition = addLabelValue("  Project ID", proj.projectId, yPosition);
        yPosition = addLabelValue("  Added", new Date(proj.createdAt).toLocaleString(), yPosition);
        yPosition += 4; // Reduced spacing between project items
      });
      yPosition += 6; // Reduced spacing after sections
    }

    // Top 3 Projects
    if (data.reportMetrics.topProjects && data.reportMetrics.topProjects.length > 0) {
      yPosition = checkAndAddPage(yPosition, 2);
      yPosition = addSectionHeader("Top 3 Projects by Votes", yPosition);

      data.reportMetrics.topProjects.forEach((project, index) => {
        yPosition = checkAndAddPage(yPosition, 2);
        yPosition = addLabelValue(`Rank #${index + 1}`, project.name, yPosition);
        yPosition = addLabelValue("  Project ID", project.id, yPosition);
        yPosition = addLabelValue("  Votes", project.votes, yPosition);
        yPosition = addLabelValue("  Description", project.description || "No description", yPosition);
        yPosition += 4; // Reduced spacing between project items
      });
    }

    // Check if we need a new page for voting details
    if (yPosition > 250) {
      doc.addPage();
      addHeader(2);
      yPosition = 60; // Start content below header
    }

    // Campaign Vote Hashes
    if (data.campaign.votes && data.campaign.votes.length > 0) {
      yPosition = checkAndAddPage(yPosition, 2);
      yPosition = addSectionHeader("Campaign Vote Hashes", yPosition);
      data.campaign.votes.forEach((vote, index) => {
        yPosition = checkAndAddPage(yPosition, 2);
        yPosition = addLabelValue(`Vote Hash ${index + 1}`, vote.vote_hash || "N/A", yPosition);
        yPosition += 2; // Reduced spacing between vote hashes
      });
      yPosition += 6; // Reduced spacing after sections
    }

    // Voting Details (first 10 votes)
    if (data.voting && data.voting.votes && data.voting.votes.length > 0) {
      yPosition = checkAndAddPage(yPosition, 3);
      yPosition = addSectionHeader("Voting Details (First 10 Votes)", yPosition);

      data.voting.votes.slice(0, 10).forEach((vote, index) => {
        yPosition = checkAndAddPage(yPosition, 3);
        yPosition = addLabelValue(`Vote #${index + 1}`, `${vote.user.first_name} ${vote.user.last_name}`, yPosition);
        yPosition = addLabelValue("  Email", vote.user.business_email, yPosition);
        yPosition = addLabelValue(
          "  Project",
          data.projects.find(p => p.id === vote.project.id)?.projectName ||
            vote.project.projectName ||
            "Unnamed Project",
          yPosition
        );
        yPosition = addLabelValue("  Reason", vote.voteData.reason || "No reason provided", yPosition);
        yPosition = addLabelValue("  Vote Hash", vote.vote_hash || "N/A", yPosition);
        yPosition += 4; // Reduced spacing between vote items
      });
    }

    // Blockchain Verification
    if (data.blockchain && data.blockchain.votes && data.blockchain.votes.length > 0) {
      yPosition = checkAndAddPage(yPosition, 4);
      yPosition = addSectionHeader("Blockchain Verification (First 10 Votes)", yPosition);

      data.blockchain.votes.slice(0, 10).forEach((vote, index) => {
        yPosition = checkAndAddPage(yPosition, 4);
        yPosition = addLabelValue(`Blockchain Vote #${index + 1}`, vote.userName || "N/A", yPosition);
        yPosition = addLabelValue("  Email", vote.email || "N/A", yPosition);
        yPosition = addLabelValue(
          "  Project",
          data.projects.find(p => p.id === vote.projectId)?.projectName || vote.projectName || "Unnamed Project",
          yPosition
        );
        yPosition = addLabelValue("  Reason", vote.reason || "No reason provided", yPosition);
        yPosition = addLabelValue("  Blockchain Address", vote.voterAddress || "N/A", yPosition);
        yPosition += 4; // Reduced spacing between blockchain vote items
      });
    }

    // Report Footer
    yPosition = checkAndAddPage(yPosition, 5);
    yPosition = addSectionHeader("Report Information", yPosition);
    yPosition = addLabelValue("Report Generated", new Date().toLocaleString(), yPosition);
    yPosition = addLabelValue("Campaign ID", data.exportMetadata.campaignId, yPosition);
    yPosition = addLabelValue("Data Version", data.exportMetadata.dataVersion, yPosition);
    yPosition = addLabelValue("Total Votes in Campaign", data.reportMetrics.totalVotes, yPosition);
    yPosition = addLabelValue("Blockchain Verified Votes", data.reportMetrics.verifiedVotes, yPosition);

    // Add footer to all pages
    const addFooter = pageNum => {
      const footerY = doc.internal.pageSize.height - 20;

      // Footer background
      doc.setFillColor(245, 247, 250);
      doc.rect(0, footerY - 15, pageWidth, 15, "F");

      // Footer text
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Nature Wired - Campaign Report - Page ${pageNum}`, margin, footerY - 5);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - margin - 80, footerY - 5);
    };

    // Add footer to current page
    addFooter(1);

    // Save the PDF
    doc.save(`campaign_${data.exportMetadata.campaignId}_comprehensive_report.pdf`);
  };

  const generatePowerPoint = async data => {
    try {
      // Import pptxgenjs dynamically to avoid build issues
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();

      // Set presentation properties
      pptx.author = "Nature Wired";
      pptx.company = "Nature Wired";
      pptx.title = "Nature Backers Campaign Report";
      pptx.subject = `Campaign ${data.exportMetadata.campaignId} Report`;

      // Slide 1: Title Slide
      const slide1 = pptx.addSlide();
      slide1.background = { color: "F5F7FA" };

      // Add Nature Wired logo
      try {
        slide1.addImage({
          path: "/naturewired-logo.png",
          x: 3.5,
          y: 0.5,
          w: 3,
          h: 1.5,
          sizing: { type: "contain", w: 3, h: 1.5 },
        });
      } catch (error) {
        // Fallback text logo if image fails to load
        slide1.addText("NATURE WIRED", {
          x: 3.5,
          y: 0.8,
          w: 3,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: "228B22",
          align: "center",
        });
      }

      slide1.addText("Nature Backers Campaign Report", {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1.5,
        fontSize: 32,
        bold: true,
        color: "000000",
        align: "center",
      });

      slide1.addText(`Campaign ID: ${data.exportMetadata.campaignId}`, {
        x: 0.5,
        y: 3.8,
        w: 9,
        h: 0.5,
        fontSize: 18,
        color: "666666",
        align: "center",
      });

      slide1.addText(`Generated: ${new Date().toLocaleString()}`, {
        x: 0.5,
        y: 4.3,
        w: 9,
        h: 0.5,
        fontSize: 14,
        color: "999999",
        align: "center",
      });

      // Slide 2: Campaign Information (Part 1)
      const slide2 = pptx.addSlide();
      slide2.background = { color: "FFFFFF" };

      slide2.addText("Campaign Information (Part 1)", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "000000",
      });

      const campaignInfo1 = [
        { label: "Campaign Name", value: data.campaign.name },
        { label: "Campaign ID", value: data.campaign.id },
        { label: "Voting Style", value: data.campaign.votingStyle || "N/A" },
        { label: "Status", value: data.campaign.campaignStatus?.name || "Unknown" },
        { label: "Start Date", value: new Date(data.campaign.startDate).toLocaleString() },
        { label: "End Date", value: new Date(data.campaign.endDate).toLocaleString() },
      ];

      campaignInfo1.forEach((info, index) => {
        const y = 1.2 + index * 0.5;
        if (y < 6.5) {
          slide2.addText(`${info.label}:`, {
            x: 0.5,
            y: y,
            w: 2.5,
            h: 0.3,
            fontSize: 12,
            bold: true,
            color: "000000",
          });

          slide2.addText(info.value, {
            x: 3.2,
            y: y,
            w: 6.3,
            h: 0.3,
            fontSize: 12,
            color: "333333",
          });
        }
      });

      // Slide 2.5: Campaign Information (Part 2)
      const slide2_5 = pptx.addSlide();
      slide2_5.background = { color: "FFFFFF" };

      slide2_5.addText("Campaign Information (Part 2)", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "000000",
      });

      const campaignInfo2 = [
        { label: "Created", value: new Date(data.campaign.createdAt).toLocaleString() },
        { label: "Updated", value: new Date(data.campaign.updatedAt).toLocaleString() },
        { label: "Email Subject", value: data.campaign.emailSubject || "N/A" },
        { label: "Email Body", value: data.campaign.emailBody || "N/A" },
        { label: "Campaign URL", value: data.campaign.url || "N/A" },
        { label: "Transaction Hash", value: data.campaign.tx_hash || "N/A" },
      ];

      campaignInfo2.forEach((info, index) => {
        const y = 1.2 + index * 0.5;
        if (y < 6.5) {
          slide2_5.addText(`${info.label}:`, {
            x: 0.5,
            y: y,
            w: 2.5,
            h: 0.3,
            fontSize: 12,
            bold: true,
            color: "000000",
          });

          slide2_5.addText(info.value, {
            x: 3.2,
            y: y,
            w: 6.3,
            h: 0.3,
            fontSize: 12,
            color: "333333",
          });
        }
      });

      // Slide 3: Executive Summary
      const slide3 = pptx.addSlide();
      slide3.background = { color: "FFFFFF" };

      slide3.addText("Executive Summary", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "000000",
      });

      const metrics = [
        { label: "Employees Engaged", value: data.reportMetrics.uniqueVoters },
        { label: "Votes Cast", value: data.reportMetrics.totalVotes },
        { label: "Verified Projects", value: data.reportMetrics.verifiedVotes },
        { label: "Participation Rate", value: `${data.reportMetrics.participationRate}%` },
        { label: "Total Projects", value: data.reportMetrics.totalProjects },
      ];

      metrics.forEach((metric, index) => {
        const y = 1.2 + index * 0.6;
        if (y < 6.5) {
          slide3.addText(`${metric.label}: ${metric.value}`, {
            x: 0.5,
            y: y,
            w: 9,
            h: 0.4,
            fontSize: 14,
            bold: true,
            color: "333333",
          });
        }
      });

      // Slide 4: Campaign Departments (if available)
      if (data.campaign.CampaignDepartment && data.campaign.CampaignDepartment.length > 0) {
        const slide4 = pptx.addSlide();
        slide4.background = { color: "FFFFFF" };

        slide4.addText("Campaign Departments", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.campaign.CampaignDepartment.forEach((dept, index) => {
          const y = 1.2 + index * 0.4;
          if (y < 6.5) {
            slide4.addText(`Department ${index + 1}: ${dept.department?.name || `Department ${dept.departmentId}`}`, {
              x: 0.5,
              y: y,
              w: 9,
              h: 0.3,
              fontSize: 12,
              color: "333333",
            });
          }
        });
      }

      // Slide 5: Campaign Projects (if available)
      if (data.campaign.CampaignProject && data.campaign.CampaignProject.length > 0) {
        const slide5 = pptx.addSlide();
        slide5.background = { color: "FFFFFF" };

        slide5.addText("Campaign Projects", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.campaign.CampaignProject.forEach((proj, index) => {
          const y = 1.2 + index * 0.4;
          if (y < 6.5) {
            const projectName =
              data.projects.find(p => p.id === proj.projectId)?.projectName || `Project ${proj.projectId}`;
            slide5.addText(`Project ${index + 1}: ${projectName}`, {
              x: 0.5,
              y: y,
              w: 9,
              h: 0.3,
              fontSize: 12,
              color: "333333",
            });
          }
        });
      }

      // Slide 6: Top 3 Projects by Votes (if available)
      if (data.reportMetrics.topProjects && data.reportMetrics.topProjects.length > 0) {
        const slide6 = pptx.addSlide();
        slide6.background = { color: "FFFFFF" };

        slide6.addText("Top 3 Projects by Votes", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.reportMetrics.topProjects.forEach((project, index) => {
          const y = 1.2 + index * 0.5;
          if (y < 6.5) {
            slide6.addText(`#${index + 1} ${project.name} (${project.votes} votes)`, {
              x: 0.5,
              y: y,
              w: 9,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: "333333",
            });
          }
        });
      }

      // Slide 7: Campaign Vote Hashes (if available)
      if (data.campaign.votes && data.campaign.votes.length > 0) {
        const slide7 = pptx.addSlide();
        slide7.background = { color: "FFFFFF" };

        slide7.addText("Campaign Vote Hashes", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.campaign.votes.slice(0, 5).forEach((vote, index) => {
          const y = 1.2 + index * 0.4;
          if (y < 6.5) {
            slide7.addText(`Vote ${index + 1}: ${vote.vote_hash || "N/A"}`, {
              x: 0.5,
              y: y,
              w: 9,
              h: 0.3,
              fontSize: 10,
              fontFace: "Courier New",
              color: "333333",
            });
          }
        });
      }

      // Slide 8: Voting Details (First 3 Votes)
      if (data.voting && data.voting.votes && data.voting.votes.length > 0) {
        const slide8 = pptx.addSlide();
        slide8.background = { color: "FFFFFF" };

        slide8.addText("Voting Details (First 3 Votes)", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.voting.votes.slice(0, 3).forEach((vote, index) => {
          const y = 1.2 + index * 1.2;
          if (y < 6.5) {
            const projectName =
              data.projects.find(p => p.id === vote.project.id)?.projectName ||
              vote.project.projectName ||
              "Unnamed Project";

            slide8.addText(`Vote ${index + 1}:`, {
              x: 0.5,
              y: y,
              w: 1.5,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: "000000",
            });

            slide8.addText(`${vote.user.first_name} ${vote.user.last_name}`, {
              x: 2.2,
              y: y,
              w: 3,
              h: 0.3,
              fontSize: 12,
              color: "333333",
            });

            slide8.addText(vote.user.business_email, {
              x: 5.4,
              y: y,
              w: 4.1,
              h: 0.3,
              fontSize: 10,
              color: "666666",
            });

            slide8.addText(`Project: ${projectName}`, {
              x: 2.2,
              y: y + 0.35,
              w: 7.3,
              h: 0.25,
              fontSize: 10,
              color: "333333",
            });

            slide8.addText(`Reason: ${vote.voteData.reason || "No reason provided"}`, {
              x: 2.2,
              y: y + 0.6,
              w: 7.3,
              h: 0.4,
              fontSize: 9,
              color: "666666",
            });
          }
        });
      }

      // Slide 9: Blockchain Verification (First 3 Votes)
      if (data.blockchain && data.blockchain.votes && data.blockchain.votes.length > 0) {
        const slide9 = pptx.addSlide();
        slide9.background = { color: "FFFFFF" };

        slide9.addText("Blockchain Verification (First 3 Votes)", {
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 0.8,
          fontSize: 24,
          bold: true,
          color: "000000",
        });

        data.blockchain.votes.slice(0, 3).forEach((vote, index) => {
          const y = 1.2 + index * 1.2;
          if (y < 6.5) {
            const projectName =
              data.projects.find(p => p.id === vote.projectId)?.projectName || vote.projectName || "Unnamed Project";

            slide9.addText(`Vote ${index + 1}:`, {
              x: 0.5,
              y: y,
              w: 1.5,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: "000000",
            });

            slide9.addText(vote.userName || "N/A", {
              x: 2.2,
              y: y,
              w: 3,
              h: 0.3,
              fontSize: 12,
              color: "333333",
            });

            slide9.addText(vote.email || "N/A", {
              x: 5.4,
              y: y,
              w: 4.1,
              h: 0.3,
              fontSize: 10,
              color: "666666",
            });

            slide9.addText(`Project: ${projectName}`, {
              x: 2.2,
              y: y + 0.35,
              w: 7.3,
              h: 0.25,
              fontSize: 10,
              color: "333333",
            });

            slide9.addText(`Address: ${vote.voterAddress || "N/A"}`, {
              x: 2.2,
              y: y + 0.6,
              w: 7.3,
              h: 0.4,
              fontSize: 9,
              color: "666666",
              fontFace: "Courier New",
            });
          }
        });
      }

      // Slide 10: Report Information
      const slide10 = pptx.addSlide();
      slide10.background = { color: "FFFFFF" };

      slide10.addText("Report Information", {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "000000",
      });

      const reportInfo = [
        { label: "Report Generated", value: new Date().toLocaleString() },
        { label: "Campaign ID", value: data.exportMetadata.campaignId },
        { label: "Data Version", value: data.exportMetadata.dataVersion },
        { label: "Total Votes in Campaign", value: data.reportMetrics.totalVotes },
        { label: "Blockchain Verified Votes", value: data.reportMetrics.verifiedVotes },
      ];

      reportInfo.forEach((info, index) => {
        const y = 1.2 + index * 0.6;
        slide10.addText(`${info.label}:`, {
          x: 0.5,
          y: y,
          w: 3.5,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: "000000",
        });

        slide10.addText(info.value.toString(), {
          x: 4.2,
          y: y,
          w: 5.3,
          h: 0.4,
          fontSize: 14,
          color: "333333",
        });
      });

      // Save the PowerPoint
      pptx.writeFile({ fileName: `campaign_${data.exportMetadata.campaignId}_comprehensive_report.pptx` });
    } catch (error) {
      console.error("Error generating PowerPoint:", error);
      // Fallback: Generate HTML report instead
      generateHTMLReport(data);
    }
  };

  const generateHTMLReport = data => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nature Backers Campaign Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #228b22; }
        .title { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 24px; font-weight: bold; color: #228b22; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 15px; }
        .label { font-weight: bold; color: #333; }
        .value { color: #666; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #228b22; }
        .metric-value { font-size: 32px; font-weight: bold; color: #228b22; }
        .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
        .project-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid #228b22; }
        .vote-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .hash { font-family: 'Courier New', monospace; font-size: 12px; background: #f1f3f4; padding: 5px; border-radius: 3px; word-break: break-all; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Nature Backers Campaign Report</div>
            <div class="subtitle">Campaign ID: ${
              data.exportMetadata.campaignId
            } | Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="section">
            <div class="section-title">Campaign Information</div>
            <div class="info-grid">
                <div class="label">Campaign Name:</div>
                <div class="value">${data.campaign.name}</div>
                <div class="label">Campaign ID:</div>
                <div class="value">${data.campaign.id}</div>
                <div class="label">Voting Style:</div>
                <div class="value">${data.campaign.votingStyle || "N/A"}</div>
                <div class="label">Status:</div>
                <div class="value">${data.campaign.campaignStatus?.name || "Unknown"}</div>
                <div class="label">Start Date:</div>
                <div class="value">${new Date(data.campaign.startDate).toLocaleString()}</div>
                <div class="label">End Date:</div>
                <div class="value">${new Date(data.campaign.endDate).toLocaleString()}</div>
                <div class="label">Created:</div>
                <div class="value">${new Date(data.campaign.createdAt).toLocaleString()}</div>
                <div class="label">Updated:</div>
                <div class="value">${new Date(data.campaign.updatedAt).toLocaleString()}</div>
                <div class="label">Email Subject:</div>
                <div class="value">${data.campaign.emailSubject || "N/A"}</div>
                <div class="label">Email Body:</div>
                <div class="value">${data.campaign.emailBody || "N/A"}</div>
                <div class="label">Campaign URL:</div>
                <div class="value">${data.campaign.url || "N/A"}</div>
                <div class="label">Transaction Hash:</div>
                <div class="value hash">${data.campaign.tx_hash || "N/A"}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${data.reportMetrics.uniqueVoters}</div>
                    <div class="metric-label">Employees Engaged</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.reportMetrics.totalVotes}</div>
                    <div class="metric-label">Votes Cast</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.reportMetrics.verifiedVotes}</div>
                    <div class="metric-label">Verified Projects</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.reportMetrics.participationRate}%</div>
                    <div class="metric-label">Participation Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.reportMetrics.totalProjects}</div>
                    <div class="metric-label">Total Projects</div>
                </div>
            </div>
        </div>

        ${
          data.campaign.CampaignDepartment && data.campaign.CampaignDepartment.length > 0
            ? `
        <div class="section">
            <div class="section-title">Campaign Departments</div>
            ${data.campaign.CampaignDepartment.map(
              (dept, index) => `
                <div class="project-item">
                    <strong>Department ${index + 1}:</strong> ${
                dept.department?.name || `Department ${dept.departmentId}`
              }
                </div>
            `
            ).join("")}
        </div>
        `
            : ""
        }

        ${
          data.campaign.CampaignProject && data.campaign.CampaignProject.length > 0
            ? `
        <div class="section">
            <div class="section-title">Campaign Projects</div>
            ${data.campaign.CampaignProject.map((proj, index) => {
              const projectName =
                data.projects.find(p => p.id === proj.projectId)?.projectName || `Project ${proj.projectId}`;
              return `
                    <div class="project-item">
                        <strong>Project ${index + 1}:</strong> ${projectName}<br>
                        <small>ID: ${proj.projectId} | Added: ${new Date(proj.createdAt).toLocaleString()}</small>
                    </div>
                `;
            }).join("")}
        </div>
        `
            : ""
        }

        ${
          data.reportMetrics.topProjects && data.reportMetrics.topProjects.length > 0
            ? `
        <div class="section">
            <div class="section-title">Top 3 Projects by Votes</div>
            ${data.reportMetrics.topProjects
              .map(
                (project, index) => `
                <div class="project-item">
                    <strong>#${index + 1} ${project.name}</strong><br>
                    <small>ID: ${project.id} | Votes: ${project.votes}</small><br>
                    ${
                      project.description && project.description !== "No description available"
                        ? `<small>${project.description}</small>`
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        ${
          data.campaign.votes && data.campaign.votes.length > 0
            ? `
        <div class="section">
            <div class="section-title">Campaign Vote Hashes</div>
            ${data.campaign.votes
              .map(
                (vote, index) => `
                <div class="vote-item">
                    <strong>Vote ${index + 1}:</strong><br>
                    <div class="hash">${vote.vote_hash || "N/A"}</div>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        ${
          data.voting && data.voting.votes && data.voting.votes.length > 0
            ? `
        <div class="section">
            <div class="section-title">Voting Details</div>
            ${data.voting.votes
              .slice(0, 10)
              .map((vote, index) => {
                const projectName =
                  data.projects.find(p => p.id === vote.project.id)?.projectName ||
                  vote.project.projectName ||
                  "Unnamed Project";
                return `
                    <div class="vote-item">
                        <strong>Vote ${index + 1}:</strong> ${vote.user.first_name} ${vote.user.last_name}<br>
                        <small>Email: ${vote.user.business_email}</small><br>
                        <small>Project: ${projectName}</small><br>
                        <small>Reason: ${vote.voteData.reason || "No reason provided"}</small><br>
                        <div class="hash">Hash: ${vote.vote_hash || "N/A"}</div>
                    </div>
                `;
              })
              .join("")}
        </div>
        `
            : ""
        }

        ${
          data.blockchain && data.blockchain.votes && data.blockchain.votes.length > 0
            ? `
        <div class="section">
            <div class="section-title">Blockchain Verification</div>
            ${data.blockchain.votes
              .slice(0, 10)
              .map((vote, index) => {
                const projectName =
                  data.projects.find(p => p.id === vote.projectId)?.projectName ||
                  vote.projectName ||
                  "Unnamed Project";
                return `
                    <div class="vote-item">
                        <strong>Blockchain Vote ${index + 1}:</strong> ${vote.userName || "N/A"}<br>
                        <small>Email: ${vote.email || "N/A"}</small><br>
                        <small>Project: ${projectName}</small><br>
                        <small>Reason: ${vote.reason || "No reason provided"}</small><br>
                        <div class="hash">Address: ${vote.voterAddress || "N/A"}</div>
                    </div>
                `;
              })
              .join("")}
        </div>
        `
            : ""
        }

        <div class="section">
            <div class="section-title">Report Information</div>
            <div class="info-grid">
                <div class="label">Report Generated:</div>
                <div class="value">${new Date().toLocaleString()}</div>
                <div class="label">Campaign ID:</div>
                <div class="value">${data.exportMetadata.campaignId}</div>
                <div class="label">Data Version:</div>
                <div class="value">${data.exportMetadata.dataVersion}</div>
                <div class="label">Total Votes in Campaign:</div>
                <div class="value">${data.reportMetrics.totalVotes}</div>
                <div class="label">Blockchain Verified Votes:</div>
                <div class="value">${data.reportMetrics.verifiedVotes}</div>
            </div>
        </div>

        <div class="footer">
            <p>Nature Wired - Comprehensive Campaign Report</p>
            <p>Generated on ${new Date().toLocaleString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
    </div>
</body>
</html>`;

    // Create and download the HTML file
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign_${data.exportMetadata.campaignId}_comprehensive_report.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <SidebarLayout>
      <div className="p-8 ml-4">
        <h1 className="text-2xl font-bold mb-6">Export Campaign Data</h1>

        <div className="max-w-xl space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isLoading || loadingCampaigns}
            >
              <option value="">{loadingCampaigns ? "Loading campaigns..." : "Choose a campaign"}</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat("CSV")}
                disabled={isLoading}
                className={`p-3 rounded ${
                  exportFormat === "CSV" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                CSV
              </button>
              <button
                onClick={() => setExportFormat("PDF")}
                disabled={isLoading}
                className={`p-3 rounded ${
                  exportFormat === "PDF" ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                PDF
              </button>
              <button
                onClick={() => setExportFormat("PPTX")}
                disabled={isLoading}
                className={`p-3 rounded ${
                  exportFormat === "PPTX" ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                PowerPoint
              </button>
              <button
                onClick={() => setExportFormat("JSON")}
                disabled={isLoading}
                className={`p-3 rounded ${
                  exportFormat === "JSON" ? "bg-purple-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                JSON
              </button>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!selectedCampaign || !exportFormat || isLoading}
            className={`w-full py-2 rounded ${
              !selectedCampaign || !exportFormat || isLoading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "Exporting..." : "Export Data"}
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}

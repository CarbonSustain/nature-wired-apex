import Image from 'next/image'
import { useState } from 'react'

function renderValue(val) {
  if (Array.isArray(val)) {
    return val.map(item => typeof item === 'string' ? item : item?.name).join(', ')
  }
  if (val && typeof val === 'object') {
    return val.name || ''
  }
  return val
}

// Function to get non-null fields from project data
function getNonNullFields(project) {
  const fields = [];
  
  // Define the fields we want to check and display (only meaningful ones)
  const fieldMappings = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'ecosystemType', label: 'Ecosystem Type' },
    { key: 'projectType', label: 'Project Type' },
    { key: 'landUseType', label: 'Land Use Type' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'methodology', label: 'Methodology' },
    { key: 'status', label: 'Status' },
    { key: 'network', label: 'Network' },
    { key: 'sdgs', label: 'SDGs' }
  ];

  fieldMappings.forEach(({ key, label }) => {
    const value = project[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        fields.push({ key, label, value });
      } else if (!Array.isArray(value)) {
        // Filter out meaningless values
        const stringValue = String(value);
        if (stringValue.length < 100 && 
            !stringValue.includes('urn:uuid:') && 
            !stringValue.includes('did:hedera:') &&
            !stringValue.includes('bafkreig') &&
            !stringValue.includes('Qm') &&
            !stringValue.match(/^[a-f0-9]{32,}$/)) {
          fields.push({ key, label, value });
        }
      }
    }
  });

  return fields;
}

export default function ProjectResultCard({ project, onClick, selected, expanded, onViewDetail, onFetchDetails }) {
  const [detailData, setDetailData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const nonNullFields = getNonNullFields(project);

  const handleViewDetail = async () => {
    if (showDetails) {
      setShowDetails(false);
      setDetailData(null);
      return;
    }

    if (project.consensusTimestamp && onFetchDetails) {
      setLoadingDetails(true);
      try {
        const details = await onFetchDetails(project.consensusTimestamp);
        setDetailData(details);
        setShowDetails(true);
      } catch (error) {
        console.error('Error fetching details:', error);
        alert('Failed to fetch project details');
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 bg-white shadow mb-4 transition ring-2 ${selected ? 'ring-green-500' : 'ring-transparent'}`}
    >
      <div className="flex items-center gap-4">
        <div onClick={onClick} className="cursor-pointer flex items-center gap-4 flex-1">
          <Image src="/naturewired-logo.png" alt="Nature Backers Logo" width={64} height={64} className="w-16 h-16 object-contain rounded" />
          <div className="flex-1">
            <div className="font-bold text-lg">{project.projectName || project.name || 'Unnamed Project'}</div>
            <div className="text-gray-600 mb-2">
              {project.primarySector && <span className="mr-2">• {project.primarySector}</span>}
              {project.projectTypes && <span className="mr-2">• {project.projectTypes}</span>}
              {project.standards && <span>• {project.standards}</span>}
            </div>
          </div>
        </div>
        <button
          className="ml-4 px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleViewDetail}
          disabled={loadingDetails}
        >
          {loadingDetails ? 'Loading...' : (showDetails ? 'Hide Detail' : 'View Detail')}
        </button>
      </div>
      
      {/* Show simple info in the main view */}
      {expanded && !showDetails && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm space-y-2">
            <div className="flex">
              <span className="font-semibold w-1/3 text-gray-700">Project Name:</span>
              <span className="w-2/3 text-gray-900">{project.projectName || project.name || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-1/3 text-gray-700">Status:</span>
              <span className="w-2/3 text-gray-900">{project.status || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-1/3 text-gray-700">Primary Sector:</span>
              <span className="w-2/3 text-gray-900">{project.primarySector || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-1/3 text-gray-700">Project Types:</span>
              <span className="w-2/3 text-gray-900">{project.projectTypes || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-1/3 text-gray-700">Standards:</span>
              <span className="w-2/3 text-gray-900">{project.standards || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Show detailed data from API */}
      {showDetails && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-lg mb-3 text-gray-800">Detailed Project Information</h4>
          {detailData ? (
            <div className="text-sm space-y-3">
              {/* Show specific fields from the new project API response */}
              {detailData.id && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">ID:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.id}</span>
                </div>
              )}
              {detailData.projectName && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Project Name:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.projectName}</span>
                </div>
              )}
              {detailData.uniqueId && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Unique ID:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.uniqueId}</span>
                </div>
              )}
              {detailData.created_at && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Created At:</span>
                  <span className="w-2/3 text-gray-900 break-words">
                    {new Date(detailData.created_at).toLocaleString()}
                  </span>
                </div>
              )}
              {detailData.latitude && detailData.longitude && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Location:</span>
                  <span className="w-2/3 text-gray-900 break-words">
                    {detailData.latitude}, {detailData.longitude}
                  </span>
                </div>
              )}
              {detailData.primarySector && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Primary Sector:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.primarySector}</span>
                </div>
              )}
              {detailData.secondarySector && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Secondary Sector:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.secondarySector}</span>
                </div>
              )}
              {detailData.projectMethodology && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Project Methodology:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.projectMethodology}</span>
                </div>
              )}
              {detailData.projectTypes && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Project Types:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.projectTypes}</span>
                </div>
              )}
              {detailData.standards && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Standards:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.standards}</span>
                </div>
              )}
              {detailData.status && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Status:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.status}</span>
                </div>
              )}
              {detailData.consensusTimestamp && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Consensus Timestamp:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.consensusTimestamp}</span>
                </div>
              )}
              {detailData.verificationMethod && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Verification Method:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.verificationMethod}</span>
                </div>
              )}
              {detailData.proofPurpose && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Proof Purpose:</span>
                  <span className="w-2/3 text-gray-900 break-words">{detailData.proofPurpose}</span>
                </div>
              )}
              {detailData.sdgs && detailData.sdgs.length > 0 && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">SDGs:</span>
                  <span className="w-2/3 text-gray-900 break-words">
                    {detailData.sdgs.map(sdg => `${sdg.sdg.name} (${sdg.sdg.id})`).join(', ')}
                  </span>
                </div>
              )}
              {detailData.impactAndRiskAssessments && detailData.impactAndRiskAssessments.length > 0 && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">Risk Assessments:</span>
                  <div className="w-2/3 text-gray-900">
                    {detailData.impactAndRiskAssessments.map((assessment, index) => (
                      <div key={index} className="mb-1 text-xs">{assessment}</div>
                    ))}
                  </div>
                </div>
              )}
              {detailData.impactAndRiskSdgs && detailData.impactAndRiskSdgs.length > 0 && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold w-1/3 text-gray-700">SDG Impact & Risk:</span>
                  <div className="w-2/3 text-gray-900">
                    {detailData.impactAndRiskSdgs.map((sdg, index) => (
                      <div key={index} className="mb-1 text-xs">{sdg}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No detailed information available</div>
          )}
        </div>
      )}
    </div>
  );
} 
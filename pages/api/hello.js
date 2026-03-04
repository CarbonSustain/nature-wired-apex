// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({ name: "John Doe" });
}
// const handleCreateCampaign = async (formData) => {
//   try {
//     // If you need to send a file, use FormData:
//     const data = new FormData();
//     data.append('name', formData.name);
//     data.append('votingStyle', formData.votingStyle);
//     data.append('startDate', formData.startDate);
//     data.append('endDate', formData.endDate);
//     data.append('emailSubject', formData.emailSubject || '');
//     data.append('emailBody', formData.emailBody || '');
//     if (formData.file) data.append('file', formData.file);

//     const response = await fetch('http://localhost:4000/campaign', {
//       method: 'POST',
//       body: data,
//       // Do NOT set Content-Type header when using FormData; browser will set it
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || 'Failed to create campaign');
//     }

//     const result = await response.json();
//     // Do something with result.data
//     alert('Campaign created!');
//   } catch (err) {
//     alert(err.message);
//   }
// };
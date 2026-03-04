export const formatDate = dateString => {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
  // → "2025-08-27T17:00:00.000Z"
};

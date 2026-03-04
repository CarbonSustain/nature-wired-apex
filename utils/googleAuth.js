// Utility functions for managing Google user data in localStorage

export const GOOGLE_USER_KEY = 'googleUser';

/**
 * Store Google user data in localStorage
 * @param {Object} userData - User data from Google OAuth
 */
export const storeGoogleUser = (userData) => {
  try {
    const dataToStore = {
      email: userData.email,
      name: userData.name,
      image: userData.image,
      provider: 'google',
      lastSignIn: new Date().toISOString(),
    };
    
    localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(dataToStore));
    console.log('Google user data stored:', dataToStore);
    return true;
  } catch (error) {
    console.error('Error storing Google user data:', error);
    return false;
  }
};

/**
 * Get Google user data from localStorage
 * @returns {Object|null} User data or null if not found
 */
export const getGoogleUser = () => {
  try {
    const userData = localStorage.getItem(GOOGLE_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving Google user data:', error);
    return null;
  }
};

/**
 * Clear Google user data from localStorage
 */
export const clearGoogleUser = () => {
  try {
    localStorage.removeItem(GOOGLE_USER_KEY);
    console.log('Google user data cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing Google user data:', error);
    return false;
  }
};

/**
 * Check if user is signed in with Google (based on localStorage)
 * @returns {boolean}
 */
export const isGoogleUserSignedIn = () => {
  const userData = getGoogleUser();
  return userData !== null;
};

/**
 * Update last sign-in timestamp
 */
export const updateLastSignIn = () => {
  try {
    const userData = getGoogleUser();
    if (userData) {
      userData.lastSignIn = new Date().toISOString();
      localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(userData));
    }
  } catch (error) {
    console.error('Error updating last sign-in:', error);
  }
}; 
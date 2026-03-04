// Utility functions for backend authentication using Google tokens

const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

/**
 * Get the current user's backend authentication data
 * @returns {Object|null} Backend user data or null if not available
 */
export const getBackendUserData = () => {
  try {
    const data = localStorage.getItem("backendUserData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving backend user data:", error);
    return null;
  }
};

/**
 * Check if user is authenticated with backend
 * @returns {boolean}
 */
export const isBackendAuthenticated = () => {
  const userData = getBackendUserData();
  return userData !== null && userData.backendUserId !== undefined;
};

/**
 * Get the current access token for backend requests
 * @returns {string|null} Access token or null if not available
 */
export const getAccessToken = () => {
  const userData = getBackendUserData();
  return userData?.accessToken || null;
};

/**
 * Get the current ID token for backend requests
 * @returns {string|null} ID token or null if not available
 */
export const getIdToken = () => {
  const userData = getBackendUserData();
  return userData?.idToken || null;
};

/**
 * Make an authenticated request to the backend
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authenticatedRequest = async (endpoint, options = {}) => {
  const accessToken = getAccessToken();
  const idToken = getIdToken();

  if (!accessToken) {
    throw new Error("No access token available. Please sign in again.");
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Google tokens to headers
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (idToken) {
    headers["X-Google-ID-Token"] = idToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // If token is expired, try to refresh
  if (response.status === 401) {
    // You might want to implement token refresh here
    throw new Error("Authentication expired. Please sign in again.");
  }

  return response;
};

/**
 * Clear backend authentication data
 */
export const clearBackendAuth = () => {
  try {
    localStorage.removeItem("backendUserData");
    console.log("Backend authentication data cleared");
  } catch (error) {
    console.error("Error clearing backend authentication data:", error);
  }
};

// Token management utilities for backend authentication

// Check if token is expired (with 5 minute buffer)
export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + buffer > expiresAt;
}

// Check if refresh token is expired (with 1 hour buffer)
export function isRefreshTokenExpired(refreshExpiresAt) {
  if (!refreshExpiresAt) return true;
  const buffer = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() + buffer > refreshExpiresAt;
}

// Refresh access token using the backend
export async function refreshAccessToken(googleSub) {
  try {
    console.log("🔄 Refreshing access token for googleSub:", googleSub);

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        google_sub: googleSub,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Refresh token failed:", response.status, errorText);
      throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Access token refreshed successfully");

    return {
      accessToken: data.access_token,
      idToken: null, // Backend doesn't return new id_token
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    throw error;
  }
}

// Get user data from backend with automatic token refresh
export async function getUserDataWithRefresh(
  userId,
  googleSub,
  currentAccessToken,
  expiresAt,
  refreshToken,
  refreshExpiresAt
) {
  try {
    // Check if access token is expired
    if (isTokenExpired(expiresAt)) {
      console.log("⏰ Access token expired, attempting refresh...");

      // Check if refresh token is also expired
      if (isRefreshTokenExpired(refreshExpiresAt)) {
        console.log("❌ Refresh token expired, user needs to sign in again");
        throw new Error("REFRESH_TOKEN_EXPIRED");
      }

      // Refresh the access token
      const refreshData = await refreshAccessToken(googleSub);

      // Update session with new tokens
      const session = await getSession();
      if (session) {
        session.accessToken = refreshData.accessToken;
        session.idToken = refreshData.idToken;
        session.refreshToken = refreshData.refreshToken;
        session.expiresAt = refreshData.expiresAt;
        session.refreshExpiresAt = refreshData.refreshExpiresAt;

        // Store updated session data
        localStorage.setItem(
          "backendUserData",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("backendUserData") || "{}"),
            accessToken: refreshData.accessToken,
            idToken: refreshData.idToken,
            refreshToken: refreshData.refreshToken,
            expiresAt: refreshData.expiresAt,
            refreshExpiresAt: refreshData.refreshExpiresAt,
          })
        );
      }

      currentAccessToken = refreshData.accessToken;
    }

    // Now fetch user data with valid token
    console.log("📡 Fetching user data from backend...");
    const response = await fetch(`${API_BASE}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to fetch user data:", response.status, errorText);
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }

    const userData = await response.json();
    console.log("✅ User data fetched successfully:", userData);

    return userData;
  } catch (error) {
    if (error.message === "REFRESH_TOKEN_EXPIRED") {
      // Sign out user and redirect to sign in
      console.log("🚪 Signing out user due to expired refresh token");
      localStorage.removeItem("backendUserData");
      localStorage.removeItem("googleUser");
      window.location.href = "/auth/signin";
      return null;
    }

    console.error("❌ Error in getUserDataWithRefresh:", error);
    throw error;
  }
}

// Get current session data from localStorage
export function getCurrentSessionData() {
  try {
    const backendData = localStorage.getItem("backendUserData");
    if (backendData) {
      return JSON.parse(backendData);
    }
    return null;
  } catch (error) {
    console.error("❌ Error parsing session data:", error);
    return null;
  }
}

// Check if user needs to be signed out due to token expiration
export function checkTokenExpiration() {
  const sessionData = getCurrentSessionData();
  if (!sessionData) return false;

  const { expiresAt, refreshExpiresAt } = sessionData;

  // If refresh token is expired, sign out
  if (isRefreshTokenExpired(refreshExpiresAt)) {
    console.log("🚪 Refresh token expired, signing out user");
    localStorage.removeItem("backendUserData");
    localStorage.removeItem("googleUser");
    window.location.href = "/auth/signin";
    return true;
  }

  return false;
}

// Initialize token expiration check on app load
export function initializeTokenCheck() {
  // Check immediately
  checkTokenExpiration();

  // Check every 5 minutes
  setInterval(checkTokenExpiration, 5 * 60 * 1000);
}

// Make authenticated API call with automatic token refresh
export async function authenticatedApiCall(endpoint, options = {}) {
  try {
    const sessionData = getCurrentSessionData();
    if (!sessionData) {
      throw new Error("No session data available");
    }

    const { accessToken, expiresAt, refreshToken, refreshExpiresAt, googleSub } = sessionData;

    // Check if we need to refresh the token
    if (isTokenExpired(expiresAt)) {
      console.log("⏰ Access token expired, refreshing...");

      if (isRefreshTokenExpired(refreshExpiresAt)) {
        console.log("❌ Refresh token expired, signing out");
        localStorage.removeItem("backendUserData");
        localStorage.removeItem("googleUser");
        window.location.href = "/auth/signin";
        return null;
      }

      // Refresh the token
      const refreshData = await refreshAccessToken(googleSub);

      // Update localStorage with new tokens
      const updatedSessionData = {
        ...sessionData,
        accessToken: refreshData.accessToken,
        idToken: refreshData.idToken,
        refreshToken: refreshData.refreshToken,
        expiresAt: refreshData.expiresAt,
        refreshExpiresAt: refreshData.refreshExpiresAt,
      };
      localStorage.setItem("backendUserData", JSON.stringify(updatedSessionData));

      // Use the new access token
      sessionData.accessToken = refreshData.accessToken;
    }

    // Make the API call with valid token
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${sessionData.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be invalid, try to refresh
        console.log("🔄 Token invalid, attempting refresh...");
        const refreshData = await refreshAccessToken(googleSub);

        // Retry the request with new token
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${refreshData.accessToken}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`API call failed: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error in authenticatedApiCall:", error);
    throw error;
  }
}

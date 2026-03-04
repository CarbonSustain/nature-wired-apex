import { useState, useEffect } from "react";
import { getGoogleUser, isGoogleUserSignedIn } from "@/utils/googleAuth";

export default function GoogleUserInfo() {
  const [userData, setUserData] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check if user is signed in and get user data
    const user = getGoogleUser();
    const signedIn = isGoogleUserSignedIn();

    setUserData(user);
    setIsSignedIn(signedIn);
  }, []);

  if (!isSignedIn || !userData) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No Google user data found in localStorage</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Google User Data (from localStorage)</h3>

      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          {userData.image && <img src={userData.image} alt={userData.name} className="w-10 h-10 rounded-full" />}
          <div>
            <p className="font-medium">{userData.name}</p>
            <p className="text-sm text-gray-600">{userData.email}</p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>Provider: {userData.provider}</p>
          <p>Last Sign In: {new Date(userData.lastSignIn).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <p className="font-medium mb-1">Raw localStorage data:</p>
        <pre className="text-gray-600 overflow-auto">{JSON.stringify(userData, null, 2)}</pre>
      </div>
    </div>
  );
}

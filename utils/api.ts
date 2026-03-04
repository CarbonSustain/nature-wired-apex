import { getGoogleUser } from "@/utils/googleAuth";
// utils/api.js
const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

export async function getUserByEmail(email) {
    const url = `${API_BASE}/user/email/${encodeURIComponent(email)}`; // encode ONCE
    console.log(url);
    const res = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        // If your NestJS requires auth, add it here:
        // headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text(); // read once

    let json = null;
    if (contentType.includes("application/json")) {
        try { json = JSON.parse(text); } catch { }
    }

    if (!res.ok) {
        const msg = (json && json.message)
            || `HTTP ${res.status} ${res.statusText}`
            || "Request failed";

        // show a small preview of unexpected HTML to aid debugging
        const preview = !contentType.includes("application/json")
            ? ` | Non-JSON response (${contentType}): ${text.slice(0, 120)}…`
            : "";
        throw new Error(msg + preview);
    }

    if (!json) throw new Error("Server did not return JSON.");
    return json; // { statusCode, message, data }
}

export async function getUserId(): Promise<number | null> {
    try {
        const gUser = getGoogleUser();
        if (!gUser?.email) {
            console.error("⚠️ Google user not found or missing email");
            return null;
        }

        const user = await getUserByEmail(gUser.email);

        if (!user?.data?.id) {
            console.error("⚠️ User not found in database for email:", gUser.email);
            return null;
        }

        return user.data.id;
    } catch (err) {
        console.error("❌ Error in getUserId helper:", err);
        return null;
    }
}


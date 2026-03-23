// pages/admin/create.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SidebarLayout from "@/components/SidebarLayout";

export default function CreateCampaign() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  const [form, setForm] = useState({
    name: "",
    emailSubject: "",
    emailBody: "",
    votingStyle: "TOKEN_BASED",
    startDateLocal: "", // datetime-local
    endDateLocal: "", // datetime-local
    gameEvent: "",
    departmentIds: [],
  });

  const [departments, setDepartments] = useState([]);
  const [brandingFileName, setBrandingFileName] = useState("");
  const [brandingPreviewDataUrl, setBrandingPreviewDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Load existing draft (if user comes back)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("campaignDraft");
      if (raw) {
        const draft = JSON.parse(raw);
        setForm(prev => ({
          ...prev,
          name: draft.name || "",
          emailSubject: draft.emailSubject || "",
          emailBody: draft.emailBody || "",
          votingStyle: draft.votingStyle || "TOKEN_BASED",
          startDateLocal: toLocalDatetime(draft.startDateISO || draft.startDate) || "",
          endDateLocal: toLocalDatetime(draft.endDateISO || draft.endDate) || "",
          gameEvent: draft.gameEvent || "",
          departmentIds: Array.isArray(draft.departmentIds) ? draft.departmentIds : [],
        }));
        setBrandingFileName(draft.brandingFileName || "");
        setBrandingPreviewDataUrl(draft.brandingPreviewDataUrl || "");
      }
    } catch {}
  }, []);

  // Fetch departments and auto-select Fans
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/department`);
        const body = await res.json();
        const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        if (mounted) {
          setDepartments(list);
          const fans = list.find(d => d.name?.toLowerCase() === 'fans');
          if (fans) {
            setForm(prev => ({ ...prev, departmentIds: [fans.id] }));
          }
        }
      } catch (e) {
        console.error("Department load error:", e);
        if (mounted) setDepartments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  }

  function onToggleDepartment(id) {
    setForm(p => {
      const has = p.departmentIds.includes(id);
      return { ...p, departmentIds: has ? p.departmentIds.filter(x => x !== id) : [...p.departmentIds, id] };
    });
  }

  // Persist branding file as dataURL + filename
  function onBrandingFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBrandingFileName(file.name);
      setBrandingPreviewDataUrl(String(reader.result || ""));

      try {
        const raw = sessionStorage.getItem("campaignDraft");
        const draft = raw ? JSON.parse(raw) : {};
        draft.brandingFileName = file.name;
        draft.brandingPreviewDataUrl = String(reader.result || "");
        sessionStorage.setItem("campaignDraft", JSON.stringify(draft));
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  // Save draft & go to Select Projects page
  function onNext() {
    if (!form.name) {
      alert("Campaign Name is required.");
      return;
    }
    if (!form.startDateLocal) {
      alert("Start Date is required.");
      return;
    }
    if (!form.endDateLocal) {
      alert("End Date is required.");
      return;
    }

    // Convert local datetime to UTC ISO
    const startDateISO = toUtcIso(form.startDateLocal);
    const endDateISO = toUtcIso(form.endDateLocal);

    if (!startDateISO || !endDateISO) {
      alert("Invalid date format.");
      return;
    }

    const draft = {
      name: form.name,
      emailSubject: form.emailSubject,
      emailBody: form.emailBody,
      votingStyle: form.votingStyle,
      startDateISO,
      endDateISO,
      gameEvent: form.gameEvent,
      departmentIds: form.departmentIds,
      brandingFileName,
      brandingPreviewDataUrl,
    };
    try {
      sessionStorage.setItem("campaignDraft", JSON.stringify(draft));
    } catch {}

    router.push("/admin/select-projects");
  }

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto p-8 text-black">
        <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>

        <div className="space-y-6">
          {/* Basic fields */}
          <div>
            <label className="block font-medium mb-1">Campaign Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full border rounded p-2"
              placeholder="e.g., CarbonSustain Campaign"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Email Subject</label>
            <input
              name="emailSubject"
              value={form.emailSubject}
              onChange={onChange}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Email Body</label>
            <textarea
              name="emailBody"
              value={form.emailBody}
              onChange={onChange}
              className="w-full border rounded p-2 min-h-[120px]"
            />
          </div>

          {/* Voting style */}
          <div>
            <label className="block font-medium mb-1">Voting Style</label>
            <select
              name="votingStyle"
              value={form.votingStyle}
              onChange={onChange}
              className="w-full border rounded p-2"
            >
              <option value="TOKEN_BASED">TOKEN_BASED</option>
              <option value="STORY_FEATURE">STORY_FEATURE</option>
              <option value="THEMED_BADGES">THEMED_BADGES</option>
            </select>
          </div>

          {/* Dates (keep time with datetime-local) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Start</label>
              <input
                type="datetime-local"
                name="startDateLocal"
                value={form.startDateLocal}
                onChange={onChange}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">End</label>
              <input
                type="datetime-local"
                name="endDateLocal"
                value={form.endDateLocal}
                onChange={onChange}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Game Events */}
          <div>
            <label className="block font-medium mb-1">Game Events</label>
            <select
              name="gameEvent"
              value={form.gameEvent}
              onChange={onChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select a game event…</option>
              <option value="flag-football-game-night-sf">Flag Football Game Night - San Francisco, CA</option>
              <option value="flag-football-classic-la">Flag Football Classic - Los Angeles, CA</option>
              <option value="flag-football-championships-westfield">Flag Football Championships - Westfield, IN</option>
            </select>
          </div>

          {/* Departments — hidden, always defaults to Fans */}

          {/* Branding */}
          <div>
            <label className="block font-medium mb-1">Branding Logo</label>
            <input type="file" accept="image/*" onChange={onBrandingFileChange} className="block w-full text-sm" />
            {brandingFileName && <div className="text-sm mt-1">Using file: {brandingFileName}</div>}
            {brandingPreviewDataUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brandingPreviewDataUrl} alt="Branding preview" className="max-h-24 rounded border" />
              </div>
            )}
          </div>

          {/* Next */}
          <div className="flex items-center justify-end">
            <button onClick={onNext} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
              Next: Select Projects
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

/* ---------------- helpers ---------------- */

function toUtcIso(localDatetimeValue) {
  if (!localDatetimeValue) return "";
  // datetime-local value is interpreted in local timezone by Date()
  const d = new Date(localDatetimeValue);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

function toLocalDatetime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // format to yyyy-MM-ddTHH:mm for input
  const pad = n => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

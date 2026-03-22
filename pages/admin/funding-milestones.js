// pages/admin/funding-milestones.js
import { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { handleGetallCampaign } from "../../utils/campaignApi";

const MILESTONES = [
  { votes: 1, amount: 1500, label: "Kickoff" },
  { votes: 2, amount: 3000, label: "Halftime" },
  { votes: 3, amount: 5000, label: "Final Whistle" },
];
const MAX_AMOUNT = 5000;
const MAX_VOTES = 3;

function getGamePhase(campaign) {
  const now = Date.now();
  const start = campaign.startDate ? new Date(campaign.startDate).getTime() : null;
  const end = campaign.endDate ? new Date(campaign.endDate).getTime() : null;

  // Status-based overrides for terminal states
  const statusName = (campaign.campaignStatus?.name || "").toLowerCase();
  if (statusName === "pending" || statusName === "approved") return "whistle";

  if (!start || !end || isNaN(start) || isNaN(end)) return "pre-game";

  if (now < start) return "pre-game";
  const mid = start + (end - start) / 2;
  if (now >= end) return "whistle";
  if (now >= mid) return "halftime";
  return "kickoff";
}

function getVoteCount(campaign) {
  if (Array.isArray(campaign.votes)) return campaign.votes.length;
  if (typeof campaign.votes === "number") return campaign.votes;
  if (campaign.votes && typeof campaign.votes === "object") return Object.keys(campaign.votes).length;
  return 0;
}

function getUnlockedAmount(voteCount) {
  // Hard-coded: 3 votes = full unlock
  const capped = Math.min(voteCount, MAX_VOTES);
  if (capped === 0) return 0;
  const milestone = MILESTONES.slice().reverse().find((m) => capped >= m.votes);
  return milestone ? milestone.amount : 0;
}

const PHASE_CONFIG = {
  "pre-game": {
    label: "Pre-Game",
    icon: "🕐",
    color: "bg-gray-100 text-gray-700",
    barColor: "bg-gray-400",
    position: 0,
  },
  kickoff: {
    label: "Kickoff",
    icon: "⚽",
    color: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
    position: 25,
  },
  halftime: {
    label: "Halftime",
    icon: "🔔",
    color: "bg-yellow-100 text-yellow-700",
    barColor: "bg-yellow-500",
    position: 50,
  },
  whistle: {
    label: "Final Whistle",
    icon: "🏁",
    color: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-500",
    position: 100,
  },
};

function TimeProgressBar({ campaign }) {
  const start = campaign.startDate ? new Date(campaign.startDate).getTime() : null;
  const end = campaign.endDate ? new Date(campaign.endDate).getTime() : null;
  const now = Date.now();

  let pct = 0;
  if (start && end && !isNaN(start) && !isNaN(end) && end > start) {
    pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Start{campaign.startDate ? `: ${new Date(campaign.startDate).toLocaleDateString()}` : ""}</span>
        <span>End{campaign.endDate ? `: ${new Date(campaign.endDate).toLocaleDateString()}` : ""}</span>
      </div>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-visible">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Phase markers */}
        {[
          { pct: 0, label: "KO" },
          { pct: 50, label: "HT" },
          { pct: 100, label: "FT" },
        ].map(({ pct: p, label }) => (
          <div
            key={p}
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${p}%` }}
          >
            <div className="w-1 h-3 bg-gray-400 opacity-60" />
            <span className="text-[10px] text-gray-400 mt-0.5">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneFundingBar({ voteCount }) {
  const unlocked = getUnlockedAmount(voteCount);
  const pct = (unlocked / MAX_AMOUNT) * 100;

  return (
    <div className="mt-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-semibold text-gray-800">
          ${unlocked.toLocaleString()}
          <span className="text-gray-400 font-normal"> / ${MAX_AMOUNT.toLocaleString()} funding unlocked</span>
        </span>
        <span className="text-xs text-gray-500">{voteCount}/{MAX_VOTES} votes</span>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${
            pct >= 100 ? "bg-blue-500" : pct >= 67 ? "bg-yellow-500" : pct >= 33 ? "bg-green-500" : "bg-gray-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {MILESTONES.map((m) => {
          const reached = voteCount >= m.votes;
          return (
            <div
              key={m.votes}
              className={`flex flex-col items-center text-xs ${reached ? "text-gray-800 font-semibold" : "text-gray-400"}`}
              style={{ width: "33%" }}
            >
              <span className={`w-2 h-2 rounded-full mb-0.5 ${reached ? "bg-green-500" : "bg-gray-300"}`} />
              <span>${(m.amount / 1000).toFixed(1)}k</span>
              <span className="text-[10px]">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CampaignMilestoneCard({ campaign }) {
  const phase = getGamePhase(campaign);
  const voteCount = getVoteCount(campaign);
  const unlocked = getUnlockedAmount(voteCount);
  const phaseConf = PHASE_CONFIG[phase];

  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{campaign.name || `Campaign #${campaign.id}`}</h2>
          {campaign.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${phaseConf.color}`}>
            {phaseConf.icon} {phaseConf.label}
          </span>
        </div>
      </div>

      <TimeProgressBar campaign={campaign} />
      <MilestoneFundingBar voteCount={voteCount} />

      {unlocked > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 font-medium">
          ✅ ${unlocked.toLocaleString()} / ${MAX_AMOUNT.toLocaleString()} funding has been unlocked
        </div>
      )}
      {unlocked === 0 && (
        <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-500">
          No funding unlocked yet — first vote unlocks $1,500
        </div>
      )}
    </div>
  );
}

export default function FundingMilestones() {
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleGetallCampaign()
      .then((res) => {
        const all = res.data || [];
        // Exclude cancelled
        const filtered = all.filter(
          (c) => (c.campaignStatus?.name || "").toLowerCase() !== "cancelled"
        );
        // Sort by startDate desc
        filtered.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
        setCampaigns(filtered);
      })
      .catch((err) => setError(err.message));
  }, []);

  const totalUnlocked = campaigns
    ? campaigns.reduce((sum, c) => sum + getUnlockedAmount(getVoteCount(c)), 0)
    : 0;

  return (
    <SidebarLayout>
      <div className="p-8 text-black max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Funding Milestones</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vote milestones unlock funding — 1 vote = $1,500 · 2 votes = $3,000 · 3 votes = $5,000
          </p>
        </div>

        {/* Summary banner */}
        {campaigns && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Campaigns</div>
              <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Unlocked</div>
              <div className="text-2xl font-bold text-green-700">${totalUnlocked.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Max Possible</div>
              <div className="text-2xl font-bold text-gray-400">${(campaigns.length * MAX_AMOUNT).toLocaleString()}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">{error}</div>
        )}

        {!campaigns && !error && (
          <div className="text-gray-500 animate-pulse">Loading campaigns...</div>
        )}

        {campaigns && campaigns.length === 0 && (
          <div className="text-gray-500">No active campaigns found.</div>
        )}

        <div className="space-y-4">
          {campaigns?.map((campaign) => (
            <CampaignMilestoneCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}

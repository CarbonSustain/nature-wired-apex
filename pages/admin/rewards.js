import { useState, useEffect } from "react";
import Image from "next/image";
import SidebarLayout from "@/components/SidebarLayout";
import { getUserId } from "@/utils/api";

const REWARD_ICONS = {
  smiley: "/reward-smiley.svg",
  ballot: "/reward-ballot.svg",
  globe: "/reward-globe.svg",
};

function RewardCard({ reward, points, walletAddress, onClaim, isClaiming, isClaimed }) {
  const icon = REWARD_ICONS[reward.icon] || REWARD_ICONS.smiley;
  const progressPct = reward.required > 0
    ? Math.min(Math.round((reward.progress / reward.required) * 100), 100)
    : 100;

  return (
    <div
      className={`relative rounded-2xl border-2 p-6 flex flex-col items-center text-center transition-all duration-300 ${
        reward.unlocked
          ? "border-green-400 bg-gradient-to-b from-green-50 to-white shadow-lg shadow-green-100"
          : "border-gray-200 bg-white opacity-80"
      }`}
    >
      {reward.unlocked && (
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Icon */}
      <div className={`mb-4 p-2 rounded-full ${reward.unlocked ? "bg-yellow-50" : "bg-gray-50 grayscale"}`}>
        <Image src={icon} alt={reward.name} width={96} height={96} className="drop-shadow-md" />
      </div>

      {/* Badge name */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">{reward.name}</h3>
      <p className="text-sm text-gray-500 mb-4 min-h-[40px]">{reward.description}</p>

      {/* Progress bar */}
      <div className="w-full mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{reward.progress} / {reward.required}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${
              reward.unlocked ? "bg-green-500" : "bg-blue-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Points reward */}
      <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
        reward.unlocked
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}>
        +{reward.points} pts {reward.unlocked ? "earned" : "locked"}
      </div>

      {/* Geography detail */}
      {reward.regionsVoted && reward.regionsVoted.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 justify-center">
          {reward.regionsVoted.map(r => (
            <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{r}</span>
          ))}
        </div>
      )}

      {/* Claim Button */}
      {reward.unlocked && (
        <div className="w-full mt-4">
          {isClaimed ? (
            <div className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              NFT Claimed
            </div>
          ) : (
            <button
              onClick={() => onClaim(reward.id)}
              disabled={!walletAddress || isClaiming}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !walletAddress
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isClaiming
                  ? "bg-purple-200 text-purple-500 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md"
              }`}
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Claiming...
                </>
              ) : !walletAddress ? (
                "Connect Wallet to Claim"
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Claim NFT
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Rewards() {
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wallet state
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [hashconnect, setHashconnect] = useState(null);
  const [pairingData, setPairingData] = useState(null);

  // Claim state
  const [claimingRewardId, setClaimingRewardId] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimedRewards, setClaimedRewards] = useState({});

  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  useEffect(() => {
    fetchRewards();
  }, []);

  // Load claimed rewards from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("claimedRewards");
      if (stored) setClaimedRewards(JSON.parse(stored));
    } catch (e) {
      console.error("Error loading claimed rewards:", e);
    }
  }, []);


  // Clear connecting spinner once wallet is connected
  useEffect(() => {
    if (walletAddress) setWalletConnecting(false);
  }, [walletAddress]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      if (!userId) {
        setError("Could not identify user. Please sign in.");
        return;
      }
      const res = await fetch(`${API_BASE}/vote/rewards/${userId}`);
      if (!res.ok) {
        setError("Failed to load rewards data.");
        return;
      }
      const json = await res.json();
      setRewardsData(json.data);
    } catch (err) {
      console.error(err);
      setError("Error loading rewards.");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setWalletConnecting(true);
    setClaimError("");

    try {
      const { HashConnect } = await import("hashconnect");
      const { LedgerId } = await import("@hashgraph/sdk");

      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

      const appMetadata = {
        name: "Nature Backers",
        description: "Sustainability Participation Rewards",
        icons: [typeof window !== "undefined" ? `${window.location.origin}/naturewired-logo.png` : ""],
        url: typeof window !== "undefined" ? window.location.origin : "",
      };

      const hc = new HashConnect(LedgerId.TESTNET, projectId, appMetadata, false);

      await hc.init();

      hc.pairingEvent.on((data) => {
        console.log("Paired with wallet:", data);
        setPairingData(data);
        if (data.accountIds && data.accountIds.length > 0) {
          setWalletAddress(data.accountIds[0]);
        }
      });

      hc.connectionStatusChangeEvent.on((state) => {
        console.log("Connection status:", state);
      });

      setHashconnect(hc);
      await hc.openPairingModal();

      // Timeout fallback
      setTimeout(() => setWalletConnecting(false), 30000);
    } catch (err) {
      console.error("HashPack connection error:", err);
      setClaimError("Failed to connect to HashPack. Make sure the browser extension is installed.");
      setWalletConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (hashconnect) {
      try { await hashconnect.disconnect(); } catch (e) { /* ignore */ }
    }
    setWalletAddress(null);
    setPairingData(null);
    setHashconnect(null);
  };

  const associateNFTToken = async (tokenId) => {
    if (!hashconnect || !walletAddress) throw new Error("Wallet not connected");

    const { TokenAssociateTransaction, AccountId, TokenId } = await import("@hashgraph/sdk");

    const associateTx = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(walletAddress))
      .setTokenIds([TokenId.fromString(tokenId)]);

    // sendTransaction freezes and routes to HashPack for signing
    await hashconnect.sendTransaction(AccountId.fromString(walletAddress), associateTx);
  };

  const claimNFTRequest = async (userId, rewardId) => {
    const response = await fetch(`${API_BASE}/vote/claim-nft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, rewardId, walletAddress }),
    });
    return { response, result: await response.json() };
  };

  const handleClaimNFT = async (rewardId) => {
    if (!walletAddress) {
      setClaimError("Please connect your wallet first.");
      return;
    }

    setClaimingRewardId(rewardId);
    setClaimError("");
    setClaimSuccess("");

    try {
      const userId = await getUserId();
      let { response, result } = await claimNFTRequest(userId, rewardId);

      // If the wallet hasn't associated the token yet, do it now and retry once
      if (!response.ok && result.code === "TOKEN_NOT_ASSOCIATED") {
        const tokenId = result.tokenId || process.env.NEXT_PUBLIC_NFT_TOKEN_ID;
        setClaimError("Approve the token association in HashPack, then the NFT will be sent automatically...");
        await associateNFTToken(tokenId);
        setClaimError("");
        ({ response, result } = await claimNFTRequest(userId, rewardId));
      }

      if (response.ok) {
        const txHash = result.data?.txHash || "";
        setClaimSuccess(
          `NFT for "${rewardId}" claimed successfully!${txHash ? ` TX: ${txHash.slice(0, 24)}...` : ""}`
        );
        const updated = { ...claimedRewards, [rewardId]: true };
        setClaimedRewards(updated);
        localStorage.setItem("claimedRewards", JSON.stringify(updated));
      } else {
        setClaimError(result.message || "Failed to claim NFT");
      }
    } catch (err) {
      console.error("Claim error:", err);
      setClaimError(err.message?.includes("association") ? err.message : "Error claiming NFT. Please try again.");
    } finally {
      setClaimingRewardId(null);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading your rewards...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
        </div>
      </SidebarLayout>
    );
  }

  const { totalVotes, blockchainVotes, points, rewards, voteHistory } = rewardsData || {};
  const unlockedCount = rewards
    ? Object.values(rewards).filter(r => r.unlocked).length
    : 0;
  const totalPossiblePoints = rewards
    ? Object.values(rewards).reduce((s, r) => s + r.points, 0)
    : 0;
  const earnedBadgePoints = rewards
    ? Object.values(rewards).filter(r => r.unlocked).reduce((s, r) => s + r.points, 0)
    : 0;
  const totalPoints = points + earnedBadgePoints;

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Rewards</h1>
          <p className="text-gray-500">Earn points and badges for participating in blockchain-verified votes.</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-green-600">{totalPoints}</div>
            <div className="text-xs text-gray-500 mt-1">Total Points</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{blockchainVotes}</div>
            <div className="text-xs text-gray-500 mt-1">Blockchain Votes</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-violet-600">{totalVotes}</div>
            <div className="text-xs text-gray-500 mt-1">Total Votes Cast</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-amber-500">
              {unlockedCount} / {rewards ? Object.keys(rewards).length : 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Badges Unlocked</div>
          </div>
        </div>

        {/* Points explainer */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-10 text-white flex items-center gap-6 shadow-lg">
          <div className="text-5xl select-none">🌿</div>
          <div>
            <div className="text-lg font-bold mb-1">How Points Work</div>
            <div className="text-green-100 text-sm">
              Earn <span className="font-semibold text-white">10 pts</span> for each blockchain-verified vote.
              Unlock badge bonuses for reaching milestones:
              <span className="ml-1 font-semibold text-white">First Vote (+50)</span>,
              <span className="ml-1 font-semibold text-white">Project Pioneer (+100)</span>,
              <span className="ml-1 font-semibold text-white">Globe Trotter (+150)</span>.
            </div>
          </div>
          <div className="ml-auto text-right hidden md:block">
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-green-200 text-xs">pts earned of {points + totalPossiblePoints} possible</div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-10 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-900">Hedera Wallet</h2>
            <p className="text-sm text-gray-500 mt-0.5">Connect your HashPack wallet to claim participation NFTs</p>
          </div>
          <div className="px-6 py-4">
            {walletAddress ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Connected</div>
                    <div className="text-xs text-gray-500 font-mono">{walletAddress}</div>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">No wallet connected</div>
                <button
                  onClick={connectWallet}
                  disabled={walletConnecting}
                  className={`flex items-center px-5 py-2 rounded-lg text-sm font-medium text-white transition-all ${
                    walletConnecting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 shadow-sm hover:shadow-md"
                  }`}
                >
                  {walletConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Connect Wallet
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Claim success / error banners */}
        {claimSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 text-sm flex-1">{claimSuccess}</p>
            <button onClick={() => setClaimSuccess("")} className="text-green-600 hover:text-green-800 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {claimError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-800 text-sm flex-1">{claimError}</p>
            <button onClick={() => setClaimError("")} className="text-red-600 hover:text-red-800 ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Reward cards */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Badges</h2>
        {rewards ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <RewardCard
              reward={rewards.firstVote}
              walletAddress={walletAddress}
              onClaim={handleClaimNFT}
              isClaiming={claimingRewardId === rewards.firstVote.id}
              isClaimed={claimedRewards[rewards.firstVote.id]}
            />
            <RewardCard
              reward={rewards.projectPioneer}
              walletAddress={walletAddress}
              onClaim={handleClaimNFT}
              isClaiming={claimingRewardId === rewards.projectPioneer.id}
              isClaimed={claimedRewards[rewards.projectPioneer.id]}
            />
            <RewardCard
              reward={rewards.globeTrotter}
              walletAddress={walletAddress}
              onClaim={handleClaimNFT}
              isClaiming={claimingRewardId === rewards.globeTrotter.id}
              isClaimed={claimedRewards[rewards.globeTrotter.id]}
            />
          </div>
        ) : (
          <p className="text-gray-500 mb-10">No rewards data available.</p>
        )}

        {/* Vote history */}
        {voteHistory && voteHistory.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vote History</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Campaign</th>
                    <th className="px-5 py-3 text-left">Project</th>
                    <th className="px-5 py-3 text-left">Region</th>
                    <th className="px-5 py-3 text-left">Blockchain</th>
                    <th className="px-5 py-3 text-left">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {voteHistory.map((v, i) => (
                    <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-5 py-3 font-medium text-gray-800">{v.campaignName}</td>
                      <td className="px-5 py-3 text-gray-600">{v.projectName || `Project ${v.projectId}`}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{v.region}</span>
                      </td>
                      <td className="px-5 py-3">
                        {v.hasBlockchainRecord ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Verified</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold text-green-600">
                        {v.hasBlockchainRecord ? "+10" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
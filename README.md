# Nature Backers for Women’s Sports
### Hedera Hello Future Apex Hackathon 2026 — Sustainability Track 

Nature Backers for Women’s Sports is a sustainability engagement layer connecting women’s sports, sponsors, and verified environmental projects. Built on Hedera and integrated with the Hedera Guardian ecosystem, sponsors discover environmental initiatives indexed on the Guardian Global Indexer and present them to fans during live sporting events.

## Problem

Verified sustainability projects exist within the Hedera Guardian ecosystem, but participation is largely limited to registries, issuers, and buyers.

At the same time, corporate sponsors invest billions of dollars into sports partnerships and sustainability initiatives. However, these commitments are rarely visible to fans during live events.

This creates a gap between:

- corporate sustainability budgets  
- verified environmental projects  
- public participation and awareness  

There is currently no engagement layer connecting sports fans, sponsors, and verified sustainability initiatives during live sporting events.

## Market Context: Why Women’s Sports

Women’s sports are one of the fastest-growing segments in global sport and present new opportunities for sponsor engagement and community participation.
Following a record-breaking year in 2025, where global revenue surpassed $2.35 billion, the sector continues to expand rapidly.
This growth provides a natural environment to explore new fan engagement models that connect sports sponsorship with community and environmental initiatives.

## Solution

Nature Backers enables corporate sponsors to present verified sustainability projects to fans during live sporting events.

Fans participate through a simple mobile experience that allows them to:

- explore environmental initiatives  
- learn about project impact  
- express interest in volunteering  
- back one project during the game  

Participation signals are recorded on the Hedera network, and final fan results determine how sponsor funding is allocated across the projects.

## Business Model Canvas: Nature Backers for Women’s Sports

**1. Value Propositions**

- For Sponsors (e.g., Acme Sport Drinks Co): Provides a high-engagement sustainability layer for sports partnerships, transforming "invisible" ESG commitments into verifiable, fan-driven impact that builds deep brand loyalty.
- For Fans: Offers an interactive, social-consciousness experience during live games, rewarding participation with "Proof of Impact" digital tokens and local volunteering opportunities.
- For Sustainability Projects: Connects verified initiatives (via the Hedera Guardian) to new funding streams and a community-driven volunteer pipeline.

**2. Customer Segments**

- Primary: Corporate Sponsors in the sports and beverage industry looking for verifiable ESG engagement.
- Secondary: Women’s Sports Leagues and Teams (e.g., Women’s Flag Football) seeking to increase fan loyalty and social impact.
- End-Users: Socially conscious sports fans, particularly Gen Z and Millenials.

**3. Key Activities**

- Project Curation: Using the Guardian Global Indexer to discover and normalize verified environmental initiatives.
- Real-time Engagement: Managing the 4-step fan journey (Scan, Choose, Allocate, Reward) during live game moments.
- Impact Reporting: Providing sponsors with a real-time Impact Dashboard showing participation metrics and funding distribution.

**4. Key Resources**

- Hedera Network Services: HCS for immutable participation records and HTS for digital token issuance.
- Hedera Guardian Ecosystem: Access to high-integrity project data and methodologies.
- Technology Stack: Next.js frontend, Node.js backend, and digital wallet integrations (HashPack/MetaMask).

**5. Channels**

- In-Stadium Activations: QR codes on big screens, seat-back displays, and product packaging (e.g., Acme Drink bottles).
- Mobile Web App: Low-friction, browser-based fan engagement experience.
- Social Media: Promoting participation results and "Proof of Impact" tokens post-game.

**6. Customer Relationships**

- Community-Driven: Leveraging the natural alignment between women's sports and collective environmental action.
- Transparency-First: Building trust through on-chain verification of every fan vote and funding allocation.

**7. Key Partnerships**

- Hedera / Hashgraph: For technical infrastructure and ecosystem support.
- Guardian Project Developers: Providing the verified data and projects to be backed.
- Sports Marketing Agencies: To facilitate sponsor onboarding and stadium activations.

**8. Revenue Streams**

- Platform Licensing (SaaS): Recurring fees for sponsors to use the engagement layer across multiple games or seasons.
- Activation Fees: One-time fees for specific high-profile events (e.g., Game Nights in San Francisco).
- Data & Impact Analytics: Charging for deep-dive reports on fan sentiment and ESG performance.

**9. Cost Structure**

- Development & Maintenance: Continuous integration of Guardian APIs and mobile UX improvements.
- Hedera Transaction Fees: Low-cost HBAR fees for HCS and HTS operations.
- Marketing & Sales: Costs associated with acquiring corporate sponsors and sports league partnerships.

## Apex Hackathon Demo Scenario

This submission demonstrates a Women’s Flag Football game activation in the San Francisco Bay Area.

## Sponsor-Curated Projects

Before the event, Acme Sports Drinks Company, the corporate sponsor, selects three sustainability projects aligned with their sustainability priorities and goals.
Nature Backers integrates with the Hedera Guardian Global Indexer to discover verified sustainability projects based on methodology, SDG alignment, and geographic location.
For the Apex Hackathon demo, three example environmental initiatives are presented to fans as sponsor-curated projects. These illustrate how Guardian-indexed projects could be surfaced for event participants in a live sports setting.

## Fan Journey
1. Scan QR code at the stadium
2. Explore three sponsor-selected sustainability projects
3. Learn about impact and volunteer opportunities
4. Back one project during the game
5. Receive a digital participation token
6. Results allocate sponsor funding proportionally

## Hedera Integration

Nature Backers leverages Hedera network services to provide transparency, scalability, and verifiable participation.

- Hedera Consensus Service (HCS) records participation events
- Hedera Token Service (HTS) issues digital participation tokens
- Hedera Guardian ecosystem supports verified sustainability projects

## What We Built During the Hackathon

This submission builds on the existing Nature Backers MVP (originally designed for employee sustainability engagement) and adapts the platform to engagement during live women's sports events.

Hackathon deliverables include:

- Linking to the Guardian Indexer Mainnet
- Creating the Women's Flag Football sustainability activation scenario
- New QR-based fan onboarding experience
- sponsor-curated project discovery interface
- project backing interaction
- New digital participation token issuance
- Hedera transaction recording for engagement events
- New fan participation results dashboard

updated GitHub documentation and deployment guides

## Tech Stack

**Hedera Services**
- Hedera Consensus Service (HCS)
- Hedera Token Service (HTS)
- Hedera Guardian ecosystem compatibility

**Application Stack**
- Node.js backend
- Next.js frontend
- QR-based onboarding flow
- Digital wallet integration

## Technical Architecture: Fan-Powered Sustainability Experiences

Nature Backers for Women’s Sports leverages the Hedera network to bridge the gap between corporate sustainability investments and fan engagement. The architecture is designed for high-concurrency stadium environments, ensuring that every fan action is verifiable, transparent, and rewarding.

**1. Hedera Consensus Service (HCS): Immutable Participation Tracking**
Every interaction within the 4-step fan journey—from backing a project to expressing volunteer interest—is recorded as a unique message on HCS. 
- Verifiable Events: Each fan "vote" is anchored on-chain with a consensus timestamp, preventing manipulation of the final funding allocation.
- Transparency: The Impact Dashboard consumes these HCS messages in real-time to display the live percentage allocation of the $5,000 Acme Sport Drinks Co. pool.

**2. Hedera Token Service (HTS): Digital "Proof of Impact" Tokens**
To drive long-term loyalty and mainstream exposure, the platform uses HTS to issue unique digital participation tokens.
- Token Issuance: Upon completing the backing process, fans receive a token in their digital wallet (e.g., HashPack or MetaMask).
- Programmable Assets: These tokens serve as a verifiable "Proof of Impact," which can evolve into rewards or access tiers in future roadmap versions.

**3. Hedera Guardian & Global Indexer: Verified Project Discovery**
The platform integrates directly with the Hedera Guardian ecosystem to ensure the projects presented to fans are high-integrity and verified.
- Mainnet Discovery: During the hackathon, we integrated the Guardian Global Indexer on the Hedera Mainnet to dynamically discover sustainability initiatives.
- Selection Criteria: Sponsors like Acme Sport Drinks Co. curate projects based on methodology, SDG alignment, and geographic location (e.g., San Francisco Bay Area initiatives).
- Data Normalization: Our backend normalizes project metadata and correlates multiple Verifiable Credential (VC) queries from the Guardian Indexer to present fans with a simple, high-impact interface.

**4. Technical Implementation & Optimization**
- Low-Latency Experience: Given the nature of live sporting events, we implemented client-side caching to ensure a seamless mobile UI even in high-traffic stadium environments.
- Mobile-First Onboarding: A custom QR-based onboarding flow allows fans to join the experience instantly without complex registration, supporting "Guest" modes for those without pre-existing wallets.
- Tech Stack: The solution is built with a Node.js backend and a Next.js frontend, providing a robust and scalable architecture for real-world sports partnerships.

**5. The "Game Moments" & Participation Display Logic**
The platform uses key game intervals to drive fan engagement and display real-time participation metrics. While the Acme Sport Drinks Co. sustainability budget ($5,000) is a pre-committed figure, these "Game Moments" serve as milestones to reveal the current impact data and the projected proportional allocation.

**Kickoff – Engagement Milestone 1**: The sponsor reveals the first phase of the sustainability experience on the stadium big screen. The platform begins aggregating the number of backers to show early fan sentiment.

**Halftime – Participation Update**: At the mid-game break, the sponsor displays updated metrics: the total number of fans who have "backed" a project and the number of fans who have expressed interest in volunteering.

**Final Whistle – Verifiable Results**: At the end of the game, the platform calculates the final proportional allocation based on the HCS-recorded participation data. This serves as the verifiable instruction for how the sponsor’s pre-committed funds will be distributed among the three projects, ensuring the final sustainability investment directly reflects the collective preference of the fans.

## Demo
Live Demo: 

Demo Video : 

## Roadmap
Future versions of Nature Backers for Women's Sports will expand this model to support:

- real-world sports partnerships and live event pilots
- dynamic discovery of Guardian-indexed sustainability projects
- AI-powered sustainability explainers and project recommendations 
- tokenized reward tiers and recurring engagement campaigns
- volunteer coordination and community impact tracking

## Repository Contents

This repository contains hackathon submission artifacts including:
- demo links
- architecture notes
- hackathon implementation documentation

## License

Nature Backers is developed by Nature Wired.
Certain components related to Guardian Indexer integration may be open-sourced under Apache 2.0 as part of this hackathon submission.



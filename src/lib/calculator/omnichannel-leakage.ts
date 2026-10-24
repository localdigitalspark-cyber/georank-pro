/**
 * GeoRank Pro - Omnichannel Revenue Leakage & Conversion Opportunity Calculator
 * Path: /src/lib/calculator/omnichannel-leakage.ts
 *
 * Models and computes projected monthly & 12-month recoverable revenue loss across 5 pillars:
 * 1. Website Conversion & Mobile UX (~15% bounce rate loss, ~1-3 jobs/mo)
 * 2. Real-Time Communication & Speed-to-Lead (62% of unanswered calls go to rivals, ~3-5 jobs/mo)
 * 3. Self-Service Booking Friction (phone-tag only, after-hours booking loss, ~2 jobs/mo)
 * 4. Reputation, Review Velocity & Review Responses (~15% local pack CTR loss, ~2 jobs/mo)
 * 5. Customer Retention & Referral Automation (5-8% lost repeat/referral revenue, ~1-2 jobs/mo)
 */

export interface OmnichannelAuditInputs {
  avgTicketValue: number;    // e.g. £250 (range £150 - £350+)
  monthlyVisitors: number;   // e.g. 600 (range 400 - 800+)
  closeRate: number;         // e.g. 20 (20% close rate)

  // 5 Pillar Fix Toggles (false = leaking [default], true = fixed/repaired)
  websiteConversionFixed?: boolean;
  speedToLeadFixed?: boolean;
  onlineBookingFixed?: boolean;
  reputationFixed?: boolean;
  retentionFixed?: boolean;
}

export type PillarId =
  | 'websiteConversion'
  | 'speedToLead'
  | 'onlineBooking'
  | 'reputation'
  | 'retention';

export interface LeakagePillarCard {
  id: PillarId;
  pillarNumber: number;
  icon: string;
  title: string;
  shortTitle: string;
  statusBadge: string;
  statusType: 'friction' | 'critical' | 'bottleneck' | 'social_proof' | 'database';
  isFixed: boolean;
  lostJobsMonthly: number;
  monthlyLoss: number;
  annualLoss: number;
  bullets: string[];
  toggleLabel: string;
  toggleKey: keyof OmnichannelAuditInputs;
  industryBenchmark: string;
  solutionSummary: string;
}

export interface RoadmapStep {
  stepNumber: number;
  phase: string;
  timeframe: string;
  title: string;
  deliverable: string;
  targetPillars: string;
}

export interface OmnichannelLeakageReport {
  inputs: Required<OmnichannelAuditInputs>;
  currencySymbol: string;
  pillars: Record<PillarId, LeakagePillarCard>;
  pillarList: LeakagePillarCard[];
  totals: {
    totalLostJobsMonthly: number;
    totalEstimatedMonthlyLoss: number;
    totalAnnualRecoverableOpportunity: number;
    activeLeaksCount: number;
    repairedCount: number;
    infrastructureScore: number; // 0 - 100 health score
  };
  roadmap: RoadmapStep[];
}

export const DEFAULT_OMNICHANNEL_INPUTS: Required<OmnichannelAuditInputs> = {
  avgTicketValue: 250,
  monthlyVisitors: 600,
  closeRate: 20, // 20% default close rate
  websiteConversionFixed: false,
  speedToLeadFixed: false,
  onlineBookingFixed: false,
  reputationFixed: false,
  retentionFixed: false,
};

/**
 * Computes deterministic omnichannel revenue leakage and recovery opportunities.
 */
export function calculateOmnichannelLeakage(
  userInputs?: Partial<OmnichannelAuditInputs>,
  currencySymbol = '£'
): OmnichannelLeakageReport {
  const inputs: Required<OmnichannelAuditInputs> = {
    ...DEFAULT_OMNICHANNEL_INPUTS,
    ...userInputs,
  };

  const ticket = Math.max(50, inputs.avgTicketValue);
  const visitors = Math.max(100, inputs.monthlyVisitors);
  const closeRatio = Math.max(0.05, Math.min(1.0, inputs.closeRate / 100));

  // ---------------------------------------------------------------------------
  // 1. Website Conversion & Mobile UX
  // Gaps: No sticky click-to-call header, slow mobile speed, missing trust/license badges.
  // Loss: ~15% bounce rate loss (~1-3 jobs/mo).
  // ---------------------------------------------------------------------------
  const convLostJobs = inputs.websiteConversionFixed
    ? 0
    : Math.max(1, Math.min(3, Math.round(visitors * 0.04 * 0.15 * closeRatio * 4)));
  const convMonthlyLoss = convLostJobs * ticket;

  const websiteConversion: LeakagePillarCard = {
    id: 'websiteConversion',
    pillarNumber: 1,
    icon: 'Globe',
    title: 'Card 1: 🌐 Website Conversion & Friction',
    shortTitle: 'Website Conversion & Mobile UX',
    statusBadge: inputs.websiteConversionFixed ? '✓ Repaired' : '⚠️ High Friction',
    statusType: 'friction',
    isFixed: inputs.websiteConversionFixed,
    lostJobsMonthly: convLostJobs,
    monthlyLoss: convMonthlyLoss,
    annualLoss: convMonthlyLoss * 12,
    bullets: [
      'Missing prominent mobile sticky click-to-call button and tap-to-dial headers.',
      'Slow mobile page speed (>3.2s) causing high mobile visitor bounce rate.',
      'Missing local trust seals, verified licensing, and customer guarantee badges.',
    ],
    toggleLabel: 'Fix Mobile Layout & Add Sticky CTA',
    toggleKey: 'websiteConversionFixed',
    industryBenchmark: '53% of mobile visits are abandoned if pages take over 3 seconds to load.',
    solutionSummary: 'Deploy ultra-fast mobile landing layouts with sticky tap-to-call and trust verification badges.',
  };

  // ---------------------------------------------------------------------------
  // 2. Real-Time Communication & Speed-to-Lead
  // Gaps: No automated missed-call SMS text-back, no 24/7 AI web chat, no WhatsApp click-to-chat.
  // Loss: 62% of unanswered calls go to rivals (~3-5 jobs/mo).
  // ---------------------------------------------------------------------------
  const speedLostJobs = inputs.speedToLeadFixed
    ? 0
    : Math.max(3, Math.min(5, Math.round(visitors * 0.07 * 0.18 * 0.62 * closeRatio * 4.8)));
  const speedMonthlyLoss = speedLostJobs * ticket;

  const speedToLead: LeakagePillarCard = {
    id: 'speedToLead',
    pillarNumber: 2,
    icon: 'MessageSquare',
    title: 'Card 2: 💬 Speed-to-Lead & Instant Messaging',
    shortTitle: 'Speed-to-Lead & Instant Messaging',
    statusBadge: inputs.speedToLeadFixed ? '✓ Repaired' : '⚠️ Critical Leak',
    statusType: 'critical',
    isFixed: inputs.speedToLeadFixed,
    lostJobsMonthly: speedLostJobs,
    monthlyLoss: speedMonthlyLoss,
    annualLoss: speedMonthlyLoss * 12,
    bullets: [
      'No automated missed-call SMS textback: 62% of unanswered dispatch calls hire the next competitor.',
      'No 24/7 interactive AI webchat to capture late-night and weekend quote inquiries.',
      'Missing 1-tap WhatsApp business click-to-chat gateway for mobile social users.',
    ],
    toggleLabel: 'Deploy 24/7 Web Chat & Missed-Call SMS',
    toggleKey: 'speedToLeadFixed',
    industryBenchmark: '78% of local customers buy from the service provider that responds to their inquiry first.',
    solutionSummary: 'Implement automated 30-second missed-call SMS text-back and an interactive 24/7 AI web receptionist.',
  };

  // ---------------------------------------------------------------------------
  // 3. Self-Service Booking Friction
  // Gaps: Phone-tag only scheduling; no 24/7 online booking calendar for after-hours visitors.
  // Loss: ~10-15% lost bookings (~2 jobs/mo).
  // ---------------------------------------------------------------------------
  const bookingLostJobs = inputs.onlineBookingFixed
    ? 0
    : Math.max(1, Math.min(3, Math.round(visitors * 0.08 * 0.12 * closeRatio * 1.8)));
  const bookingMonthlyLoss = bookingLostJobs * ticket;

  const onlineBooking: LeakagePillarCard = {
    id: 'onlineBooking',
    pillarNumber: 3,
    icon: 'Calendar',
    title: 'Card 3: 📅 24/7 Online Booking & Scheduling',
    shortTitle: '24/7 Online Booking & Scheduling',
    statusBadge: inputs.onlineBookingFixed ? '✓ Repaired' : '⚠️ Scheduling Bottleneck',
    statusType: 'bottleneck',
    isFixed: inputs.onlineBookingFixed,
    lostJobsMonthly: bookingLostJobs,
    monthlyLoss: bookingMonthlyLoss,
    annualLoss: bookingMonthlyLoss * 12,
    bullets: [
      'Phone-tag only scheduling forces prospects to call during daytime working hours.',
      'After-hours evening searchers bounce when unable to immediately reserve a service inspection slot.',
      'High drop-off from busy homeowners who refuse back-and-forth voicemail tag.',
    ],
    toggleLabel: 'Add Self-Service Booking Calendar',
    toggleKey: 'onlineBookingFixed',
    industryBenchmark: '43% of consumers book appointments after business hours when online booking is enabled.',
    solutionSummary: 'Embed a frictionless calendar scheduler with instant SMS confirmations and calendar sync.',
  };

  // ---------------------------------------------------------------------------
  // 4. Reputation, Review Velocity & Review Responses
  // Gaps: Low review velocity (<1/mo), unresponded 5-star & negative reviews, no multi-platform review feeds (Google, FB, Trustpilot).
  // Loss: ~15% local pack CTR loss due to lack of fresh social proof (~2 jobs/mo).
  // ---------------------------------------------------------------------------
  const repLostJobs = inputs.reputationFixed
    ? 0
    : Math.max(1, Math.min(3, Math.round(visitors * 0.20 * 0.15 * closeRatio * 0.4)));
  const repMonthlyLoss = repLostJobs * ticket;

  const reputation: LeakagePillarCard = {
    id: 'reputation',
    pillarNumber: 4,
    icon: 'Star',
    title: 'Card 4: ⭐ Reputation, Review Velocity & Responses',
    shortTitle: 'Reputation, Review Velocity & Responses',
    statusBadge: inputs.reputationFixed ? '✓ Repaired' : '⚠️ Social Proof Gap',
    statusType: 'social_proof',
    isFixed: inputs.reputationFixed,
    lostJobsMonthly: repLostJobs,
    monthlyLoss: repMonthlyLoss,
    annualLoss: repMonthlyLoss * 12,
    bullets: [
      'Review velocity is stale (<1 new review/month while local 3-pack competitors add 4–8/mo).',
      'Unresponded reviews hurt Google algorithmic prominence score and signal inactive management.',
      'Zero cross-platform automated review syndication across Facebook, Google, and trade portals.',
    ],
    toggleLabel: 'Automate Post-Job Review Requests & AI Responses',
    toggleKey: 'reputationFixed',
    industryBenchmark: '87% of consumers will not consider a local business with under a 4.5★ rating or stale reviews.',
    solutionSummary: 'Automate post-job SMS review requests to capture 5–10 new 5-star reviews/mo and deploy AI review responses.',
  };

  // ---------------------------------------------------------------------------
  // 5. Customer Retention & Referral Automation
  // Gaps: No automated seasonal email/SMS check-ins, zero VIP re-booking offers, no loyalty referral system.
  // Loss: 5-8% lost repeat/referral revenue (~1-2 jobs/mo).
  // ---------------------------------------------------------------------------
  const retentionLostJobs = inputs.retentionFixed
    ? 0
    : Math.max(1, Math.min(2, Math.round(visitors * 0.015 * 0.85)));
  const retentionMonthlyLoss = retentionLostJobs * ticket;

  const retention: LeakagePillarCard = {
    id: 'retention',
    pillarNumber: 5,
    icon: 'Repeat',
    title: 'Card 5: 🔁 Database Reactivation & Retention',
    shortTitle: 'Database Reactivation & Retention',
    statusBadge: inputs.retentionFixed ? '✓ Repaired' : '⚠️ Untapped Database',
    statusType: 'database',
    isFixed: inputs.retentionFixed,
    lostJobsMonthly: retentionLostJobs,
    monthlyLoss: retentionMonthlyLoss,
    annualLoss: retentionMonthlyLoss * 12,
    bullets: [
      'Past customer contact lists sit dormant with zero automated seasonal maintenance check-ins.',
      'Absence of VIP re-booking offers allows previous clients to turn to competitors.',
      'Zero automated word-of-mouth referral incentives to turn happy customers into sales reps.',
    ],
    toggleLabel: 'Launch Quarterly Reactivation Broadcasts',
    toggleKey: 'retentionFixed',
    industryBenchmark: 'Acquiring a new customer costs 5x more than retaining an existing one.',
    solutionSummary: 'Automate quarterly seasonal SMS/email check-ins and launch a 1-click referral reward program.',
  };

  const pillarList = [websiteConversion, speedToLead, onlineBooking, reputation, retention];
  const pillars: Record<PillarId, LeakagePillarCard> = {
    websiteConversion,
    speedToLead,
    onlineBooking,
    reputation,
    retention,
  };

  // ---------------------------------------------------------------------------
  // Totals & Aggregate Opportunity
  // ---------------------------------------------------------------------------
  const totalLostJobsMonthly =
    convLostJobs + speedLostJobs + bookingLostJobs + repLostJobs + retentionLostJobs;
  const totalEstimatedMonthlyLoss =
    convMonthlyLoss + speedMonthlyLoss + bookingMonthlyLoss + repMonthlyLoss + retentionMonthlyLoss;
  const totalAnnualRecoverableOpportunity = totalEstimatedMonthlyLoss * 12;

  const activeLeaksCount = pillarList.filter((p) => !p.isFixed).length;
  const repairedCount = pillarList.filter((p) => p.isFixed).length;
  const infrastructureScore = Math.round((repairedCount / pillarList.length) * 100);

  // ---------------------------------------------------------------------------
  // The Local Revenue Recovery Roadmap (4-Step Action Plan)
  // ---------------------------------------------------------------------------
  const roadmap: RoadmapStep[] = [
    {
      stepNumber: 1,
      phase: 'Step 1 • Immediate (Days 1–7)',
      timeframe: 'Days 1–7',
      title: 'Deploy Missed-Call SMS Text-Back & 24/7 AI Web Receptionist',
      deliverable:
        'Instantly plugs the 62% unanswered phone lead leak. Any missed call receives an automated SMS within 30 seconds offering instant scheduling, while after-hours web visitors get live assistance.',
      targetPillars: 'Speed-to-Lead & Instant Messaging',
    },
    {
      stepNumber: 2,
      phase: 'Step 2 • Foundation (Days 7–14)',
      timeframe: 'Days 7–14',
      title: 'Launch Ultra-Fast Mobile Layout & 24/7 Online Booking Calendar',
      deliverable:
        'Cuts mobile bounce rates in half with sticky tap-to-call CTAs, trust badges, and an embedded self-scheduling calendar that allows evening prospects to reserve slots without phone tag.',
      targetPillars: 'Website Conversion & Online Booking',
    },
    {
      stepNumber: 3,
      phase: 'Step 3 • Authority (Days 14–21)',
      timeframe: 'Days 14–21',
      title: 'Automate Post-Job Review Generation & 100% AI Review Response Engine',
      deliverable:
        'Triggers automated review requests via SMS upon job completion to capture 5–10 new 5-star Google reviews monthly, with automated instant owner responses to boost local 3-pack prominence.',
      targetPillars: 'Reputation & Review Velocity',
    },
    {
      stepNumber: 4,
      phase: 'Step 4 • Scaling (Month 1 Onwards)',
      timeframe: 'Month 1 Onwards',
      title: 'Launch Database Reactivation Campaigns & Automated Referral System',
      deliverable:
        'Broadcasts high-converting seasonal check-up offers to your past client list and sets up automated referral rewards, turning existing customers into recurring revenue generators.',
      targetPillars: 'Customer Retention & Referrals',
    },
  ];

  return {
    inputs,
    currencySymbol,
    pillars,
    pillarList,
    totals: {
      totalLostJobsMonthly,
      totalEstimatedMonthlyLoss,
      totalAnnualRecoverableOpportunity,
      activeLeaksCount,
      repairedCount,
      infrastructureScore,
    },
    roadmap,
  };
}

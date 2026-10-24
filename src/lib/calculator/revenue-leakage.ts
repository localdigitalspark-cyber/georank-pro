/**
 * GeoRank Pro - Omnichannel Revenue Leakage & Opportunity Engine
 * Path: /src/lib/calculator/revenue-leakage.ts
 *
 * Models and calculates monthly & annual revenue leakage across 5 distinct digital operational bottlenecks:
 * 1. Website Online Conversion (Speed, instant CTAs, trust signals)
 * 2. Real-Time Communications (24/7 Web Chatbot, Missed Call SMS text-back, WhatsApp/Social messaging)
 * 3. Self-Service Booking Friction (Online booking calendar, after-hours appointment loss)
 * 4. Retention & Database Reactivation (Automated newsletters, VIP re-booking, loyalty/referral rewards)
 * 5. Reputation Management & Review Velocity (Star rating, review volume vs competitors, response rate)
 * 6. Comprehensive 5-Point Strategic Growth Roadmap
 */

export interface OmnichannelLeakageFactors {
  monthlySiteVisitors: number;      // e.g. 500 visitors/mo (estimated from search/local volume)
  avgTicketValue: number;            // e.g. £350
  leadCloseRate: number;             // e.g. 25%

  // 1. Conversion Leakage
  hasMobileFastSite: boolean;        // If false: 20-30% bounce drop (~1-3 lost jobs/mo)

  // 2. Instant Communication Leakage
  hasWebsiteChatbot: boolean;        // If false: ~5-10% uncaptured after-hours leads
  hasMissedCallSmsTextback: boolean; // If false: 62% of unanswered calls hire the next competitor
  hasWhatsAppOrMessenger: boolean;   // If false: Friction for mobile/social users

  // 3. Booking Calendar Friction
  hasOnlineBookingCalendar: boolean; // If false: ~15% of prospects bounce when forced to call during working hours

  // 4. Database Reactivation & Retention
  pastCustomerListSize: number;      // e.g. 300 past customers
  hasEmailNewsletterOrOffers: boolean; // If false: Missed 2-4 repeat/service jobs per month
  hasRewardsReferralProgram: boolean;  // If false: Zero word-of-mouth automation

  // 5. Reputation Management & Review Velocity
  totalReviews: number;              // e.g. 14 reviews
  avgStarRating: number;             // e.g. 4.1
  reviewVelocityMonthly: number;     // e.g. 0.5 reviews/month
  responseRatePercent: number;       // e.g. 15% responded to
  monitorsMultiPlatform: boolean;    // Google, Facebook, Trustpilot/Checkatrade
  competitorAvgReviews?: number;     // e.g. 180 (top 3 pack competitor review count)
}

export interface OmnichannelLeakageResult {
  factors: OmnichannelLeakageFactors;

  // 1. Conversion Pillar
  conversion: {
    hasIssue: boolean;
    lostInquiriesMonthly: number;
    lostJobsMonthly: number;
    monthlyLeakage: number;
    annualLeakage: number;
    impactDescription: string;
    industryStat: string;
    remedy: string;
  };

  // 2. Real-Time Communications Pillar
  communications: {
    hasIssue: boolean;
    chatbotLostJobs: number;
    missedCallLostJobs: number;
    socialChatLostJobs: number;
    totalLostJobsMonthly: number;
    monthlyLeakage: number;
    annualLeakage: number;
    impactDescription: string;
    industryStat: string;
    remedy: string;
  };

  // 3. Booking Calendar Pillar
  booking: {
    hasIssue: boolean;
    lostInquiriesMonthly: number;
    lostJobsMonthly: number;
    monthlyLeakage: number;
    annualLeakage: number;
    impactDescription: string;
    industryStat: string;
    remedy: string;
  };

  // 4. Retention & Database Reactivation Pillar
  retention: {
    hasIssue: boolean;
    newsletterLostJobs: number;
    referralLostJobs: number;
    totalLostJobsMonthly: number;
    monthlyLeakage: number;
    annualLeakage: number;
    impactDescription: string;
    industryStat: string;
    remedy: string;
  };

  // 5. Reputation, Review Velocity & Response Engine Pillar
  reputation: {
    hasIssue: boolean;
    totalReviews: number;
    avgStarRating: number;
    reviewVelocityMonthly: number;
    responseRatePercent: number;
    monitorsMultiPlatform: boolean;
    isSub4Point5: boolean;
    isLowReviewCount: boolean;
    isLowVelocity: boolean;
    isLowResponseRate: boolean;
    isSinglePlatform: boolean;
    penaltyPercent: number;
    missedClicksMonthly: number;
    lostJobsMonthly: number;
    monthlyLeakage: number;
    annualLeakage: number;
    statusBadge: string;
    impactDescription: string;
    industryStat: string;
    remedy: string;
    unrespondedFlag: string;
    auditedGaps: {
      velocityGap: string;
      responseGap: string;
      crossPlatformGap: string;
    };
    projectedOpportunity: {
      reviewCaptureTarget: string;
      aiResponderTarget: string;
      reclaimedRevenueRange: string;
    };
  };

  // Aggregated Omnichannel Totals
  totals: {
    totalLostJobsMonthly: number;
    totalMonthlyLeakage: number;
    totalAnnualLeakage: number;
    operationalDeficitScore: number; // 0 - 100 score of friction
  };

  // Strategic Growth Roadmap
  roadmapSteps: {
    stepNumber: number;
    pillar: string;
    title: string;
    timeframe: string;
    monthlyRecoveryEst: number;
    keyDeliverable: string;
    priority: 'Immediate (Week 1-2)' | 'Core (Month 1)' | 'Scale (Month 2)';
  }[];
}

export const DEFAULT_LEAKAGE_FACTORS: OmnichannelLeakageFactors = {
  monthlySiteVisitors: 650,
  avgTicketValue: 450,
  leadCloseRate: 30, // 30% close rate

  // 1. Conversion
  hasMobileFastSite: false, // Default to unoptimized/slow site in audit

  // 2. Communications
  hasWebsiteChatbot: false,
  hasMissedCallSmsTextback: false,
  hasWhatsAppOrMessenger: false,

  // 3. Booking
  hasOnlineBookingCalendar: false,

  // 4. Database Reactivation
  pastCustomerListSize: 380,
  hasEmailNewsletterOrOffers: false,
  hasRewardsReferralProgram: false,

  // 5. Reputation & Review Velocity Defaults
  totalReviews: 14,
  avgStarRating: 4.1,
  reviewVelocityMonthly: 0.5,
  responseRatePercent: 15,
  monitorsMultiPlatform: false,
  competitorAvgReviews: 180,
};

/**
 * Calculates deterministic omnichannel revenue leakage across digital channels.
 */
export function calculateOmnichannelRevenueLeakage(
  inputFactors?: Partial<OmnichannelLeakageFactors>
): OmnichannelLeakageResult {
  const factors: OmnichannelLeakageFactors = {
    ...DEFAULT_LEAKAGE_FACTORS,
    ...inputFactors,
  };

  const closeRatio = Math.max(0.1, Math.min(1.0, factors.leadCloseRate / 100));
  const ticket = Math.max(50, factors.avgTicketValue);
  const visitors = Math.max(50, factors.monthlySiteVisitors);
  const pastCustomers = Math.max(20, factors.pastCustomerListSize);

  // -------------------------------------------------------------------------
  // 1. WEBSITE ONLINE CONVERSION LEAKAGE
  // -------------------------------------------------------------------------
  // Industry standard: 4% baseline visitor inquiry rate.
  // Slow / mobile-unfriendly sites suffer a 25-30% bounce drop.
  const baselineInquiries = visitors * 0.04;
  const convLostInquiries = factors.hasMobileFastSite
    ? 0
    : Math.max(2, Math.round(baselineInquiries * 0.28));
  const convLostJobs = factors.hasMobileFastSite
    ? 0
    : Math.max(1, Math.round(convLostInquiries * closeRatio));
  const convMonthlyLeak = convLostJobs * ticket;

  const conversion = {
    hasIssue: !factors.hasMobileFastSite,
    lostInquiriesMonthly: convLostInquiries,
    lostJobsMonthly: convLostJobs,
    monthlyLeakage: convMonthlyLeak,
    annualLeakage: convMonthlyLeak * 12,
    impactDescription:
      'Visitors on smartphones bounce when pages take >3s to load or lack prominent tap-to-call CTAs.',
    industryStat: '53% of mobile site visits are abandoned if pages take longer than 3 seconds to load (Google Web Core Vitals).',
    remedy:
      'Deploy ultra-fast mobile landing pages with sticky click-to-call, customer review trust badges, and sub-second load times.',
  };

  // -------------------------------------------------------------------------
  // 2. REAL-TIME COMMUNICATIONS LEAKAGE
  // -------------------------------------------------------------------------
  // A. No Web Chatbot: ~8% of visitors browse after 6 PM or on weekends.
  const chatbotLostInquiries = factors.hasWebsiteChatbot
    ? 0
    : Math.max(1, Math.round(visitors * 0.08 * 0.45));
  const chatbotLostJobs = Math.round(chatbotLostInquiries * closeRatio);

  // B. Missed Call SMS Text-Back: ~12-18% of phone calls go unanswered during peak field hours.
  // 62% of missed callers hire the next competitor if not texted back within 5 minutes.
  const estInboundCalls = Math.max(15, Math.round(visitors * 0.06));
  const missedCallsMonthly = Math.max(2, Math.round(estInboundCalls * 0.16));
  const missedCallLostJobs = factors.hasMissedCallSmsTextback
    ? 0
    : Math.max(1, Math.round(missedCallsMonthly * 0.62 * closeRatio));

  // C. WhatsApp / Social Messenger: Mobile prospects increasingly prefer direct chat.
  const socialChatLostJobs = factors.hasWhatsAppOrMessenger
    ? 0
    : Math.max(1, Math.round(visitors * 0.015 * closeRatio));

  const commsTotalLostJobs = chatbotLostJobs + missedCallLostJobs + socialChatLostJobs;
  const commsMonthlyLeak = commsTotalLostJobs * ticket;

  const communications = {
    hasIssue:
      !factors.hasWebsiteChatbot ||
      !factors.hasMissedCallSmsTextback ||
      !factors.hasWhatsAppOrMessenger,
    chatbotLostJobs,
    missedCallLostJobs,
    socialChatLostJobs,
    totalLostJobsMonthly: commsTotalLostJobs,
    monthlyLeakage: commsMonthlyLeak,
    annualLeakage: commsMonthlyLeak * 12,
    impactDescription:
      'Unanswered dispatch calls and night-time searchers abandon your site and hire the next competitor who responds immediately.',
    industryStat:
      '62% of inbound phone calls left unanswered result in the prospect hiring the very next competitor on the list (Invoca Local Study).',
    remedy:
      'Implement an automated 30-second missed-call SMS text-back and an interactive 24/7 web receptionist bot to capture contact details.',
  };

  // -------------------------------------------------------------------------
  // 3. SELF-SERVICE BOOKING FRICTION
  // -------------------------------------------------------------------------
  // ~15% of high-intent prospects prefer self-scheduling without awkward back-and-forth phone tags.
  const bookingLostInquiries = factors.hasOnlineBookingCalendar
    ? 0
    : Math.max(2, Math.round(visitors * 0.025));
  const bookingLostJobs = factors.hasOnlineBookingCalendar
    ? 0
    : Math.max(1, Math.round(bookingLostInquiries * closeRatio));
  const bookingMonthlyLeak = bookingLostJobs * ticket;

  const booking = {
    hasIssue: !factors.hasOnlineBookingCalendar,
    lostInquiriesMonthly: bookingLostInquiries,
    lostJobsMonthly: bookingLostJobs,
    monthlyLeakage: bookingMonthlyLeak,
    annualLeakage: bookingMonthlyLeak * 12,
    impactDescription:
      'Busy homeowners browsing late at night cannot book inspections or service appointments without calling during office hours.',
    industryStat:
      '43% of consumers book appointments after business hours when online booking is available (GetApp Consumer Research).',
    remedy:
      'Embed a seamless calendar scheduler with automatic SMS confirmations and calendar invites directly on your landing page.',
  };

  // -------------------------------------------------------------------------
  // 4. RETENTION & DATABASE REACTIVATION DEFICITS
  // -------------------------------------------------------------------------
  // Existing customer database:
  // - 1% to 1.5% of past customers will re-book seasonal maintenance if nudged via email/SMS.
  // - 0.5% word-of-mouth referral jobs per month when incentivized with a structured reward.
  const newsletterLostJobs = factors.hasEmailNewsletterOrOffers
    ? 0
    : Math.max(1, Math.round(pastCustomers * 0.012));
  const referralLostJobs = factors.hasRewardsReferralProgram
    ? 0
    : Math.max(1, Math.round(pastCustomers * 0.005));

  const retentionTotalLostJobs = newsletterLostJobs + referralLostJobs;
  const retentionMonthlyLeak = retentionTotalLostJobs * ticket;

  const retention = {
    hasIssue: !factors.hasEmailNewsletterOrOffers || !factors.hasRewardsReferralProgram,
    newsletterLostJobs,
    referralLostJobs,
    totalLostJobsMonthly: retentionTotalLostJobs,
    monthlyLeakage: retentionMonthlyLeak,
    annualLeakage: retentionMonthlyLeak * 12,
    impactDescription:
      'Your existing customer contact list sits dormant while previous clients turn to competitors for recurring maintenance.',
    industryStat:
      'Acquiring a new customer costs 5x more than retaining an existing one. Email reactivation campaigns average a 4400% ROI (Bain & Company).',
    remedy:
      'Automate monthly seasonal email newsletters, automated 6-month service check-ins, and a 1-click referral reward program for past clients.',
  };

  // -------------------------------------------------------------------------
  // 5. REPUTATION MANAGEMENT, REVIEW VELOCITY & REVIEW RESPONSE LEAKAGE
  // -------------------------------------------------------------------------
  // Mathematical Revenue Impact Modeling:
  // "Sub-4.5 Star & Low Velocity Friction":
  // If star rating is < 4.5 or review count is < 50% of the top 3 pack competitor:
  // Apply a 15–25% penalty on local pack click-through rate (CTR).
  // Projected loss: [Missed Clicks] × [Close Rate %] × [Avg Ticket Value].
  // "Unresponded Review Conversion Drop":
  // If response rate is < 75%:
  // Flag: "Prospects viewing profile assume customer service is inactive; algorithmic prominence score penalized."

  const competitorReviews = factors.competitorAvgReviews || 180;
  const isSub4Point5 = factors.avgStarRating < 4.5;
  const isLowReviewCount = factors.totalReviews < (competitorReviews * 0.5);
  const isLowVelocity = factors.reviewVelocityMonthly < 2.0;
  const isLowResponseRate = factors.responseRatePercent < 75;
  const isSinglePlatform = !factors.monitorsMultiPlatform;

  const hasReputationIssue =
    isSub4Point5 || isLowReviewCount || isLowVelocity || isLowResponseRate || isSinglePlatform;

  // Determine penalty rate (15% to 25%)
  let penaltyPercent = 0;
  if (isSub4Point5 && (isLowReviewCount || isLowVelocity)) {
    penaltyPercent = 25;
  } else if (isSub4Point5) {
    penaltyPercent = 20;
  } else if (isLowReviewCount || isLowVelocity) {
    penaltyPercent = 15;
  }

  if (isLowResponseRate) {
    if (penaltyPercent > 0) {
      penaltyPercent = Math.min(25, penaltyPercent + 3);
    } else {
      penaltyPercent = 15;
    }
  }

  // Baseline local pack search interactions
  const baselineLocalPackClicks = Math.max(20, Math.round(visitors * 0.12));
  const repMissedClicks = penaltyPercent > 0
    ? Math.max(3, Math.round(baselineLocalPackClicks * (penaltyPercent / 100)))
    : 0;
  const repLostJobs = penaltyPercent > 0
    ? Math.max(1, Math.round(repMissedClicks * closeRatio))
    : 0;
  const repMonthlyLeak = repLostJobs * ticket;
  const repAnnualLeak = repMonthlyLeak * 12;

  const reputation = {
    hasIssue: hasReputationIssue,
    totalReviews: factors.totalReviews,
    avgStarRating: factors.avgStarRating,
    reviewVelocityMonthly: factors.reviewVelocityMonthly,
    responseRatePercent: factors.responseRatePercent,
    monitorsMultiPlatform: factors.monitorsMultiPlatform,
    isSub4Point5,
    isLowReviewCount,
    isLowVelocity,
    isLowResponseRate,
    isSinglePlatform,
    penaltyPercent,
    missedClicksMonthly: repMissedClicks,
    lostJobsMonthly: repLostJobs,
    monthlyLeakage: repMonthlyLeak,
    annualLeakage: repAnnualLeak,
    statusBadge: hasReputationIssue ? '[ ⚠️ Conversion Friction: High ]' : '[ ✓ 5-Star Reputation Engine ]',
    impactDescription:
      isSub4Point5 || isLowReviewCount
        ? `Star rating (${factors.avgStarRating.toFixed(1)}★) or review volume (${factors.totalReviews}) trails top-3 local pack competitors (${competitorReviews}+ reviews). Searchers click rivals with higher social proof.`
        : 'Reputation and review volume are strong, but consistent new reviews and 100% owner response rate protect your local 3-pack prominence.',
    industryStat:
      '87% of consumers will not consider a local business with under a 4.5-star rating or fewer than 50 verified reviews (BrightLocal Consumer Survey).',
    remedy:
      'Automate post-job SMS review requests to capture 5–10 new 5-star reviews every month. Deploy AI review responder for 100% instant responses across Google and Facebook to maximize profile prominence.',
    unrespondedFlag:
      factors.responseRatePercent < 75
        ? 'Prospects viewing profile assume customer service is inactive; algorithmic prominence score penalized.'
        : 'Active owner responses protect profile prominence and signal high attentiveness to new prospects.',
    auditedGaps: {
      velocityGap:
        factors.reviewVelocityMonthly < 2.0
          ? `Competitors are adding 4–8 verified reviews/month while this business averages <1 (${factors.reviewVelocityMonthly.toFixed(1)}/mo).`
          : `Healthy review velocity at ${factors.reviewVelocityMonthly.toFixed(1)} new reviews/month.`,
      responseGap:
        factors.responseRatePercent < 75
          ? `${factors.responseRatePercent}% response rate: 0% of 5-star reviews thanked; negative reviews left without owner reconciliation.`
          : `Strong ${factors.responseRatePercent}% response rate maintained across customer reviews.`,
      crossPlatformGap: !factors.monitorsMultiPlatform
        ? 'Zero automated review requests across Facebook or industry review portals.'
        : 'Multi-platform review monitoring and cross-syndication active.',
    },
    projectedOpportunity: {
      reviewCaptureTarget: 'Automate post-job SMS review requests to capture 5–10 new 5-star reviews every month.',
      aiResponderTarget: 'Deploy AI review responder for 100% instant responses across Google and Facebook to maximize profile prominence.',
      reclaimedRevenueRange: 'Reclaim estimated £1,400 – £3,200/mo in lost high-intent conversion volume.',
    },
  };

  // -------------------------------------------------------------------------
  // AGGREGATED TOTALS
  // -------------------------------------------------------------------------
  const totalLostJobsMonthly =
    convLostJobs + commsTotalLostJobs + bookingLostJobs + retentionTotalLostJobs + repLostJobs;
  const totalMonthlyLeakage = totalLostJobsMonthly * ticket;
  const totalAnnualLeakage = totalMonthlyLeakage * 12;

  // Operational Deficit Score (0 - 100, where 100 = maximum leakage)
  let missingPoints = 0;
  if (!factors.hasMobileFastSite) missingPoints += 20;
  if (!factors.hasWebsiteChatbot) missingPoints += 10;
  if (!factors.hasMissedCallSmsTextback) missingPoints += 15;
  if (!factors.hasWhatsAppOrMessenger) missingPoints += 5;
  if (!factors.hasOnlineBookingCalendar) missingPoints += 10;
  if (!factors.hasEmailNewsletterOrOffers) missingPoints += 10;
  if (!factors.hasRewardsReferralProgram) missingPoints += 5;

  // Reputation points (up to 25 points)
  if (isSub4Point5) missingPoints += 10;
  if (isLowReviewCount || isLowVelocity) missingPoints += 10;
  if (isLowResponseRate) missingPoints += 5;
  const operationalDeficitScore = Math.min(100, missingPoints);

  // -------------------------------------------------------------------------
  // 6. STRATEGIC GROWTH ROADMAP
  // -------------------------------------------------------------------------
  const roadmapSteps = [
    {
      stepNumber: 1,
      pillar: 'Real-Time Response',
      title: 'Deploy 30-Second Missed-Call SMS Text-Back & 24/7 Web Chatbot',
      timeframe: 'Days 1–7',
      monthlyRecoveryEst: commsMonthlyLeak,
      keyDeliverable:
        'Stops 62% of missed calls from hiring rivals. Automatically sends an SMS to missed callers and captures after-hours quote requests.',
      priority: 'Immediate (Week 1-2)' as const,
    },
    {
      stepNumber: 2,
      pillar: 'Reputation & Reviews',
      title: 'Automate Post-Job SMS Review Capture & 100% AI Review Response Engine',
      timeframe: 'Days 7–14',
      monthlyRecoveryEst: repMonthlyLeak || Math.round(ticket * 4),
      keyDeliverable:
        'Automates post-job SMS review requests to capture 5–10 new 5-star reviews every month. Deploys AI review responder for 100% instant responses across Google and Facebook.',
      priority: 'Immediate (Week 1-2)' as const,
    },
    {
      stepNumber: 3,
      pillar: 'Website Conversion & Booking',
      title: 'Launch Fast Mobile Landing Pages & Direct Online Booking Calendar',
      timeframe: 'Days 14–21',
      monthlyRecoveryEst: convMonthlyLeak + bookingMonthlyLeak,
      keyDeliverable:
        'Cuts mobile bounce rate in half with sub-second page loads, prominent dispatch CTAs, and frictionless 24/7 appointment self-booking.',
      priority: 'Core (Month 1)' as const,
    },
    {
      stepNumber: 4,
      pillar: 'Database Reactivation',
      title: 'Dormant Customer Reactivation Campaign & Referral Program',
      timeframe: 'Days 21–30',
      monthlyRecoveryEst: retentionMonthlyLeak,
      keyDeliverable:
        'Broadcasts high-converting seasonal check-up offers to your dormant contact list and sets up automated referral rewards.',
      priority: 'Core (Month 1)' as const,
    },
    {
      stepNumber: 5,
      pillar: 'Google 3-Pack Authority',
      title: 'Multi-Keyword Spatial Grid Expansion & Competitor Centroid Breaker',
      timeframe: 'Month 2 Onwards',
      monthlyRecoveryEst: Math.round(ticket * 12),
      keyDeliverable:
        'Pushes 3-pack Google Maps coverage from your immediate 1-mile centroid across the entire 10-mile metropolitan market.',
      priority: 'Scale (Month 2)' as const,
    },
  ];

  return {
    factors,
    conversion,
    communications,
    booking,
    retention,
    reputation,
    totals: {
      totalLostJobsMonthly,
      totalMonthlyLeakage,
      totalAnnualLeakage,
      operationalDeficitScore,
    },
    roadmapSteps,
  };
}

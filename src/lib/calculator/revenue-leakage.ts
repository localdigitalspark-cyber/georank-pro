/**
 * GeoRank Pro - Omnichannel Revenue Leakage & Opportunity Engine
 * Path: /src/lib/calculator/revenue-leakage.ts
 *
 * Models and calculates monthly & annual revenue leakage across 5 distinct digital operational bottlenecks:
 * 1. Website Online Conversion (Speed, instant CTAs, trust signals)
 * 2. Real-Time Communications (24/7 Web Chatbot, Missed Call SMS text-back, WhatsApp/Social messaging)
 * 3. Self-Service Booking Friction (Online booking calendar, after-hours appointment loss)
 * 4. Retention & Database Reactivation (Automated newsletters, VIP re-booking, loyalty/referral rewards)
 * 5. Comprehensive 5-Point Strategic Growth Roadmap
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

  // Aggregated Omnichannel Totals
  totals: {
    totalLostJobsMonthly: number;
    totalMonthlyLeakage: number;
    totalAnnualLeakage: number;
    operationalDeficitScore: number; // 0 - 100 score of friction
  };

  // 5. Strategic Growth Roadmap
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
  // AGGREGATED TOTALS
  // -------------------------------------------------------------------------
  const totalLostJobsMonthly =
    convLostJobs + commsTotalLostJobs + bookingLostJobs + retentionTotalLostJobs;
  const totalMonthlyLeakage = totalLostJobsMonthly * ticket;
  const totalAnnualLeakage = totalMonthlyLeakage * 12;

  // Operational Deficit Score (0 - 100, where 100 = maximum leakage)
  let missingPoints = 0;
  if (!factors.hasMobileFastSite) missingPoints += 25;
  if (!factors.hasWebsiteChatbot) missingPoints += 15;
  if (!factors.hasMissedCallSmsTextback) missingPoints += 20;
  if (!factors.hasWhatsAppOrMessenger) missingPoints += 10;
  if (!factors.hasOnlineBookingCalendar) missingPoints += 15;
  if (!factors.hasEmailNewsletterOrOffers) missingPoints += 10;
  if (!factors.hasRewardsReferralProgram) missingPoints += 5;
  const operationalDeficitScore = Math.min(100, missingPoints);

  // -------------------------------------------------------------------------
  // 5. STRATEGIC GROWTH ROADMAP
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
      pillar: 'Website Conversion',
      title: 'Launch High-Speed Mobile Landing Pages & Direct Click-to-Call CTAs',
      timeframe: 'Days 7–14',
      monthlyRecoveryEst: convMonthlyLeak,
      keyDeliverable:
        'Cuts mobile bounce rate in half with sub-second page loads, prominent dispatch phone numbers, and local trust badges.',
      priority: 'Immediate (Week 1-2)' as const,
    },
    {
      stepNumber: 3,
      pillar: 'Self-Service Booking',
      title: 'Embed Frictionless Online Appointment Booking Calendar',
      timeframe: 'Days 14–21',
      monthlyRecoveryEst: bookingMonthlyLeak,
      keyDeliverable:
        'Enables customers to book service calls 24/7 with zero phone friction. Syncs directly to your technician dispatch calendar.',
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
    totals: {
      totalLostJobsMonthly,
      totalMonthlyLeakage,
      totalAnnualLeakage,
      operationalDeficitScore,
    },
    roadmapSteps,
  };
}

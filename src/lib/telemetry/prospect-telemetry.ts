/**
 * GeoRank Pro - Client-Side Prospect Telemetry Tracker
 * Path: /src/lib/telemetry/prospect-telemetry.ts
 *
 * Captures real-time prospect interactions on shared audit decks:
 * - report_opened
 * - slider_adjusted (debounced)
 * - scenario_changed
 * - cta_clicked
 * - report_shared
 * - dwell_ping (heartbeat & page unload tracking)
 */

import { useEffect, useRef } from 'react';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let sid = window.sessionStorage.getItem('georank_prospect_session');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      window.sessionStorage.setItem('georank_prospect_session', sid);
    }
    return sid;
  } catch {
    return 'fallback_session';
  }
}

/**
 * Dispatches an analytics event to the server
 */
export async function sendProspectEvent(event: {
  scanId: string;
  businessName: string;
  eventType: string;
  details?: Record<string, any>;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const payload = {
    scanId: event.scanId || 'latest',
    businessName: event.businessName || 'Local Business',
    eventType: event.eventType,
    details: event.details || {},
    sessionId,
  };

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify(payload),
      // Keepalive allows request to complete even if page unloads
      keepalive: true,
    });
  } catch {
    // Fail silently in telemetry so customer experience is completely unaffected
  }
}

/**
 * Fires report_opened event (guaranteed at most once per session per scanId)
 */
export function trackReportOpened(scanId: string, businessName: string, details?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const key = `opened_${scanId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {}

  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'report_opened',
    details: {
      referrer: document.referrer || 'direct',
      screenWidth: window.innerWidth,
      ...(details || {}),
    },
  });
}

/**
 * Debounce map for sliders
 */
const sliderDebounceTimers: Record<string, any> = {};

/**
 * Fires slider_adjusted event with 400ms debounce
 */
export function trackSliderAdjusted(
  scanId: string,
  businessName: string,
  sliderName: string,
  sliderValue: number
) {
  const timerKey = `${scanId}_${sliderName}`;
  if (sliderDebounceTimers[timerKey]) {
    clearTimeout(sliderDebounceTimers[timerKey]);
  }

  sliderDebounceTimers[timerKey] = setTimeout(() => {
    sendProspectEvent({
      scanId,
      businessName,
      eventType: 'slider_adjusted',
      details: {
        sliderName,
        sliderValue,
      },
    });
    delete sliderDebounceTimers[timerKey];
  }, 400);
}

/**
 * Fires scenario_changed event
 */
export function trackScenarioChanged(scanId: string, businessName: string, scenario: string) {
  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'scenario_changed',
    details: {
      scenario,
    },
  });
}

/**
 * Fires cta_clicked event
 */
export function trackCtaClicked(
  scanId: string,
  businessName: string,
  ctaType: string,
  details?: Record<string, any>
) {
  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'cta_clicked',
    details: {
      ctaType,
      ...(details || {}),
    },
  });
}

/**
 * Fires report_shared event
 */
export function trackReportShared(scanId: string, businessName: string, shareMethod = 'clipboard_copy') {
  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'report_shared',
    details: {
      shareMethod,
    },
  });
}

/**
 * Fires leakage_toggled event whenever a prospect checks or unchecks one of the 5 pillar boxes
 */
export function trackLeakageToggled(
  scanId: string,
  businessName: string,
  pillarId: string,
  isFixed: boolean,
  details?: Record<string, any>
) {
  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'leakage_toggled',
    details: {
      pillarId,
      isFixed,
      action: isFixed ? 'checked_fix' : 'unchecked_fix',
      timestamp: new Date().toISOString(),
      ...(details || {}),
    },
  });
}

/**
 * Fires leakage_expanded event when a prospect expands the full 5-pillar breakdown
 */
export function trackLeakageExpanded(
  scanId: string,
  businessName: string,
  isExpanded: boolean,
  details?: Record<string, any>
) {
  sendProspectEvent({
    scanId,
    businessName,
    eventType: 'leakage_expanded',
    details: {
      isExpanded,
      timestamp: new Date().toISOString(),
      ...(details || {}),
    },
  });
}

/**
 * React Hook to track prospect dwell reading time
 */
export function useProspectDwellTracker(scanId: string, businessName: string) {
  const dwellSecondsRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    if (!scanId || typeof window === 'undefined') return;

    activeRef.current = true;
    dwellSecondsRef.current = 0;

    // Send dwell ping helper
    const sendDwellPing = () => {
      const dwell = dwellSecondsRef.current;
      if (dwell >= 5) {
        sendProspectEvent({
          scanId,
          businessName,
          eventType: 'dwell_ping',
          details: {
            dwellSeconds: dwell,
          },
        });
      }
    };

    // Increment dwell counter every second when page is visible
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        dwellSecondsRef.current += 1;
      }
    }, 1000);

    // Heartbeat ping every 25 seconds
    const heartbeat = setInterval(() => {
      sendDwellPing();
    }, 25000);

    // Send on visibility change or page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDwellPing();
      }
    };

    const handlePageHide = () => {
      sendDwellPing();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      activeRef.current = false;
      clearInterval(timer);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      sendDwellPing();
    };
  }, [scanId, businessName]);
}

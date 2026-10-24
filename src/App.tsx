/**
 * GeoRank Pro - App Entry Point & Client Router
 * Path: /src/App.tsx
 */

import React, { useState, useEffect } from 'react';
import DashboardPage from './app/page.tsx';
import { ReportPage } from './app/reports/[scanId]/page.tsx';
import { PreviewPage } from './app/preview/[businessSlug]/page.tsx';
import { BrandingProvider } from './lib/context/BrandingContext.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Determine if URL is a public report route: /reports, /reports/, /reports/:scanId
  const isReportRoute =
    currentPath === '/reports' ||
    currentPath.startsWith('/reports/') ||
    currentPath.startsWith('/reports?');
  const scanId = isReportRoute
    ? currentPath.replace(/^\/reports\/?/, '').split('?')[0].replace(/\/$/, '') || 'latest'
    : '';

  // Determine if URL is a preview route: /preview/:businessSlug
  const isPreviewRoute =
    currentPath === '/preview' ||
    currentPath.startsWith('/preview/') ||
    currentPath.startsWith('/preview?');
  const businessSlug = isPreviewRoute
    ? currentPath.replace(/^\/preview\/?/, '').split('?')[0].replace(/\/$/, '') || 'demo'
    : '';

  return (
    <BrandingProvider>
      {isReportRoute ? (
        <ReportPage
          scanId={scanId}
          onBackToDashboard={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      ) : isPreviewRoute ? (
        <PreviewPage
          businessSlug={businessSlug}
          onBackToDashboard={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      ) : (
        <DashboardPage />
      )}
    </BrandingProvider>
  );
}

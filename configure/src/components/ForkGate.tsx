import { useAdmin } from '../contexts/AdminContext';
import { Toaster } from "@/components/ui/sonner";
import { LandingPage } from './LandingPage';
import { AdminAuthGate } from './AdminAuthGate';
import { LoadingScreen } from './LoadingScreen';

// [FORK-90003] Fork-only gating: landing page + admin auth wall. Returns the
// screen to show instead of the normal app, or null when neither applies.
// Kept in its own file so App.tsx only needs one import and one call site.
export function useForkGate(isDashboardMode: boolean): JSX.Element | null {
  const { isAdmin, isGuest, isLoading, adminKeyConfigured } = useAdmin();
  const isLandingMode = !!(window as any).LANDING_MODE;
  const isStremioRoute = window.location.pathname.startsWith('/stremio/');

  if (isLandingMode) {
    return (
      <div className="dark min-h-screen w-full bg-background text-foreground">
        <LandingPage />
        <Toaster />
      </div>
    );
  }

  // Show a brief loading screen while AdminContext verifies any stored session
  if (!isStremioRoute && adminKeyConfigured && isLoading) {
    return <LoadingScreen message="Checking authentication..." showSkeleton={false} />;
  }

  // Block access to /configure and /dashboard when ADMIN_KEY is set and user is not authenticated
  if (!isStremioRoute && adminKeyConfigured && !isAdmin && !isGuest) {
    return (
      <div className="dark min-h-screen w-full bg-background text-foreground">
        <AdminAuthGate mode={isDashboardMode ? 'dashboard' : 'configure'} />
        <Toaster />
      </div>
    );
  }

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to the top of the page whenever the route changes.
 * Mount once at the root of the app (inside Router).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use 'instant' so the user doesn't see the previous page scroll away.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}
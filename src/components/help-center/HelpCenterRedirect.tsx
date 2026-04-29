import { Navigate, useParams } from 'react-router-dom';

// Redirect component for legacy /help-center/* routes to /support/*
export function HelpCenterRedirect() {
  const { categorySlug, articleSlug } = useParams<{ categorySlug?: string; articleSlug?: string }>();
  
  if (categorySlug && articleSlug) {
    return <Navigate to={`/support/${categorySlug}/${articleSlug}`} replace />;
  }
  
  if (categorySlug) {
    return <Navigate to={`/support/${categorySlug}`} replace />;
  }
  
  return <Navigate to="/support" replace />;
}

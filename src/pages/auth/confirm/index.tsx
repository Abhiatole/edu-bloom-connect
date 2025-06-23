import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This is a redirect component to standardize the email confirmation route
export default function AuthConfirm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main email confirmation handler with the URL params and hash
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    
    // Get search params and hash
    const searchParams = url.search;
    const hash = url.hash;
    
    // Construct the redirect URL
    const redirectUrl = `/email-confirmed${searchParams}${hash}`;
    
    navigate(redirectUrl, { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center">Redirecting to email confirmation page...</p>
    </div>
  );
}

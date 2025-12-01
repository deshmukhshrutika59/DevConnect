
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function GoogleRedirect() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const name = params.get("name");
    const email = params.get("email");

    if (token && name && email) {
      login(token, { name, email });
      navigate("/dashboard");
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm w-full text-center">
        
        {/* Animated Spinner */}
        <div className="bg-blue-50 p-3 rounded-full mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticating</h3>
        <p className="text-gray-500 text-sm">
          Please wait while we log you in with Google...
        </p>
      </div>
    </div>
  );
}
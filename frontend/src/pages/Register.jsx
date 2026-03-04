import React from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";
import authBh from "../assets/auth-bg.jpeg";
import { UserPlus } from "lucide-react"; // Added for visual polish

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (data) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return alert(result.message || "Error");

      login(result.token, result.user);
      navigate("/dashboard");
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Hero Image (Desktop Only) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={authBh}
          alt="Register background"
        />
        {/* Dark overlay for text readability & premium feel */}
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
        
        {/* Branding Text */}
        <div className="absolute bottom-0 left-0 p-10 text-white z-10">
           <h2 className="text-4xl font-bold">Join the Community</h2>
           <p className="mt-2 text-lg text-white/90">Connect, collaborate, and grow with developers worldwide.</p>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          {/* Header */}
          <div className="mb-8">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4 text-white">
               <UserPlus size={20} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start your journey with DevConnect today.
            </p>
          </div>

          {/* Form Wrapper */}
          <div className="mt-2">
            <AuthForm type="register" onSubmit={handleRegister} />
          </div>

          {/* Footer / Login Link */}
          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors hover:underline"
            >
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Globe, Mail, Lock, User, ArrowRight } from "lucide-react";

const AuthForm = ({ type, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (type === "register" && !formData.name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (!formData.email.trim()) {
            toast.error("Please enter your email");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Invalid email format");
            return;
        }
        if (!formData.password) {
            toast.error("Please enter your password");
            return;
        }
        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="w-full max-w-md">
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
            >
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {type === "login" ? "Welcome Back" : "Join DevConnect"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {type === "login"
                            ? "Enter your credentials to access your account"
                            : "Start your developer journey with us today"}
                    </p>
                </div>

                <div className="space-y-5">
                    {type === "register" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {type === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="mt-8 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6">
                    <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/auth/google`}
                        className="flex items-center justify-center gap-3 w-full border border-gray-300 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all text-gray-700 font-medium"
                    >
                        <Globe size={20} className="text-blue-500" />
                        <span>Google</span>
                    </a>
                </div>
            </form>
        </div>
    );
};

export default AuthForm;
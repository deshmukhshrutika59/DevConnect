import React from "react";
import { motion } from "framer-motion";
import { Users, Globe, Code, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gray-50 py-20 lg:py-32">
      
      {/* Background Grid Pattern (Visual Only) */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-blue-50" />
        <div 
            className="h-full w-full" 
            style={{ 
                backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)", 
                backgroundSize: "24px 24px" 
            }}
        ></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        
        {/* Badge (Optional Polish) */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
        >
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            The #1 Platform for Developers
        </motion.div>

        <motion.h1
          className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Connect. Collaborate. <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Build Together.
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          Join a thriving community where developers meet opportunities. Find projects, 
          land jobs, and connect with people who speak your language—code.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <Link to="/register">
            <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2">
                Get Started <ArrowRight size={20} />
            </button>
          </Link>
          <Link to="/about">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                Learn More <Info size={20} />
            </button>
          </Link>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-0"
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
        >
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-2">
                    <Users size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-900">10K+</span>
                <span className="text-sm text-gray-500">Developers</span>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-2">
                    <Globe size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-900">150+</span>
                <span className="text-sm text-gray-500">Countries</span>
            </div>

            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 text-teal-600 rounded-full mb-2">
                    <Code size={24} />
                </div>
                <span className="text-2xl font-bold text-gray-900">50K+</span>
                <span className="text-sm text-gray-500">Projects</span>
            </div>
        </motion.div>
      </div>
    </section>
  );
}
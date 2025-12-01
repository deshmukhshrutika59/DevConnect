
import React from "react";
import { motion } from "framer-motion";
import { User, Code, MessageCircle, Star, Sparkles } from "lucide-react";

const spotlightData = [
  {
    type: "Contributor",
    name: "Riya Sharma",
    role: "Full Stack Developer",
    highlight: "Built an open-source AI Interview Assistant",
    icon: <User className="w-6 h-6 text-blue-600" />,
    color: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-100"
  },
  {
    type: "Collaboration",
    name: "Ankit Patel",
    role: "Data Scientist",
    highlight: "Looking for React devs for AgriSmart 2.0 🚀",
    icon: <Code className="w-6 h-6 text-green-600" />,
    color: "bg-green-100 text-green-700",
    iconBg: "bg-green-100"
  },
  {
    type: "Discussion",
    name: "Sneha Verma",
    role: "Backend Engineer",
    highlight: "Started a discussion on building scalable APIs",
    icon: <MessageCircle className="w-6 h-6 text-purple-600" />,
    color: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-100"
  },
];

export default function CommunitySpotlight() {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-semibold mb-4 border border-amber-100">
                <Star size={16} fill="currentColor" /> Community Spotlight
            </div>
            <motion.h2
                className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                Discover what's happening <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                    in the DevConnect Community
                </span>
            </motion.h2>
            
            <p className="mt-4 text-lg text-gray-600">
                See what fellow developers are building, sharing, and collaborating on right now.
            </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {spotlightData.map((member, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {/* Header: Icon & Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${member.iconBg}`}>
                    {member.icon}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${member.color}`}>
                    {member.type}
                </span>
              </div>

              {/* Content */}
              <div className="mb-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm font-medium text-gray-500 mb-3">{member.role}</p>
                  <p className="text-gray-700 leading-relaxed">
                    "{member.highlight}"
                  </p>
              </div>

              {/* Footer (Optional visual flair) */}
              <div className="pt-4 border-t border-gray-50 flex items-center text-sm text-gray-400 font-medium">
                 <Sparkles size={14} className="mr-1 text-amber-400" /> Trending this week
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
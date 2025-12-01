
import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, MessageSquare, Zap } from "lucide-react";

const features = [
  {
    icon: <Briefcase className="w-6 h-6 text-blue-600" />,
    title: "Find Jobs & Internships",
    desc: "Browse tech jobs tailored to your skills and interests. From startups to tech giants, find your next role.",
  },
  {
    icon: <Users className="w-6 h-6 text-blue-600" />,
    title: "Join Communities",
    desc: "Collaborate and grow with like-minded engineers. Form teams for hackathons or just share code.",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
    title: "Share Knowledge",
    desc: "Write posts, share insights, and learn from others. Build your reputation as a subject matter expert.",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4">
            <Zap size={16} /> Why DevConnect?
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Everything you need to accelerate your career
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            We provide the tools and network to help you grow from a junior developer to an industry leader.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                {/* Clone element to change color on hover without complex props */}
                <div className="group-hover:text-white transition-colors duration-300">
                    {f.icon}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
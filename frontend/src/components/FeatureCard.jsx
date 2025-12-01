// // src/components/FeatureCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function FeatureCard({ title, description, icon }) {
  return (
    <motion.article
      className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
      variants={cardVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
    >
      {/* Icon Container */}
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
        <div className="text-blue-600 group-hover:text-white transition-colors duration-300">
          {/* Ensure the icon passed doesn't have hardcoded colors that override this */}
          {icon}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </motion.article>
  );
}
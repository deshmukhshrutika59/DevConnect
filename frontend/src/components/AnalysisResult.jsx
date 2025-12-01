
import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

const AnalysisResult = ({ result }) => {
  if (!result) return null;

  // 1. Handle "Old History" format (Simple Text)
  if (result.generated_description && !result.analysis) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4 text-gray-500">
            <FileText size={20} />
            <h3 className="text-lg font-bold">Legacy Analysis Report</h3>
        </div>
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          {result.generated_description}
        </div>
      </div>
    );
  }

  // 2. Handle "New Detailed" format
  const data = result.analysis || {};
  
  // Safety check
  if (!data.strengths && !data.analysis_summary) {
    return (
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 mt-6 flex items-center gap-3">
        <AlertCircle size={20} />
        <span>Analysis data is incomplete. Please try matching again.</span>
      </div>
    );
  }

  // Determine score color
  const score = data.match_score || 0;
  const scoreColor = score >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 
                     score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 
                     'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-8 overflow-hidden animate-fade-in-up">
      
      {/* Header & Score */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" /> AI Detailed Analysis
            </h3>
            <p className="text-sm text-gray-500 mt-1">Comprehensive breakdown of your profile match.</p>
        </div>
        
        <div className={`px-5 py-3 rounded-xl border flex flex-col items-center ${scoreColor}`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Match Score</span>
            <span className="text-3xl font-extrabold">{score}%</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Summary Section */}
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText size={18} /> Executive Summary
            </h4>
            <p className="text-blue-800/80 text-sm leading-relaxed">
                {data.analysis_summary}
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths Column */}
            <div className="space-y-4">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className="p-1 bg-green-100 text-green-600 rounded-full">
                        <CheckCircle size={16} />
                    </div>
                    Key Strengths
                </h4>
                <ul className="space-y-2">
                    {data.strengths?.length > 0 ? (
                        data.strengths.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100/50 text-sm text-gray-700">
                                <span className="mt-1 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                <span className="leading-snug">{item}</span>
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-400 text-sm italic pl-2">No specific strengths listed.</li>
                    )}
                </ul>
            </div>

            {/* Missing Skills Column */}
            <div className="space-y-4">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className="p-1 bg-red-100 text-red-600 rounded-full">
                        <AlertTriangle size={16} />
                    </div>
                    Missing / Critical Skills
                </h4>
                <ul className="space-y-2">
                    {data.missing_skills?.length > 0 ? (
                        data.missing_skills.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100/50 text-sm text-gray-700">
                                <span className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                <span className="leading-snug">{item}</span>
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-400 text-sm italic pl-2">No critical skills missing.</li>
                    )}
                </ul>
            </div>
        </div>

        {/* Improvement Tips */}
        <div>
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="p-1 bg-purple-100 text-purple-600 rounded-full">
                    <Lightbulb size={16} />
                </div>
                Recommended Improvements
            </h4>
            <div className="grid gap-3">
                {data.improvement_tips?.map((tip, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                        <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex-shrink-0">
                            {idx + 1}
                        </span>
                        <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                    </div>
                ))}
                {(!data.improvement_tips || data.improvement_tips.length === 0) && (
                    <p className="text-gray-400 text-sm italic pl-2">No specific improvements found.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisResult;
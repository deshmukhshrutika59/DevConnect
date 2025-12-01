import React, { useState, useEffect, createContext, useContext } from "react";
import { 
  FileText, 
  UploadCloud, 
  Briefcase, 
  Search, 
  History, 
  CheckCircle, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  X
} from "lucide-react";

// --- MOCK CONTEXT & API FOR PREVIEW ---
// In a real app, these would be imported from your actual files.

const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Mock Analysis Result Component
const AnalysisResult = ({ result }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">Analysis Report</h3>
          <p className="opacity-90 text-sm">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-center">
            <span className="block text-xs uppercase font-bold tracking-wider opacity-80">Score</span>
            <span className="text-2xl font-bold">{result.match_score}%</span>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-4">
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Executive Summary</h4>
        <p className="text-gray-600 leading-relaxed">{result.analysis_summary || result.generated_description}</p>
      </div>
      {result.missing_keywords && (
        <div>
           <h4 className="font-semibold text-gray-800 mb-2">Missing Keywords</h4>
           <div className="flex flex-wrap gap-2">
             {result.missing_keywords.map((k, i) => (
               <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-100">{k}</span>
             ))}
           </div>
        </div>
      )}
    </div>
  </div>
);

// Mock API Functions
const mockApiDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadResumeAndMatchJD = async (file, jd, userId) => {
  await mockApiDelay(1500);
  return {
    match_score: 85,
    analysis_summary: "Your resume is a strong match for this Frontend Developer role. You have demonstrated good experience with React and Tailwind, but the job description emphasizes TypeScript which appears less frequently in your profile.",
    missing_keywords: ["TypeScript", "GraphQL", "CI/CD"],
    type: "jd-match",
    timestamp: new Date().toISOString()
  };
};

const uploadResumeAndMatchTitle = async (file, title, userId) => {
  await mockApiDelay(1500);
  return {
    match_score: 72,
    analysis_summary: `Based on general industry standards for a ${title}, your resume shows solid foundational skills. To reach a senior level, consider highlighting more system design experience.`,
    type: "job-title",
    timestamp: new Date().toISOString()
  };
};

const fetchMatchHistory = async (userId) => {
  await mockApiDelay(800);
  return {
    history: [
      {
        _id: "1",
        type: "jd-match",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        match_score: 88,
        analysis: { analysis_summary: "Great fit for React Developer role." }
      },
      {
        _id: "2",
        type: "job-title",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        match_score: 65,
        generated_description: "Analysis against 'Backend Engineer' standards."
      }
    ]
  };
};

// --- MAIN COMPONENT ---

const ResumeAnalyzerContent = () => {
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMatchJD = async () => {
    if (!resumeFile || !jdText) return alert("Please provide both a resume and a job description.");
    setLoading(true);
    setError("");
    setResults(null);
    try {
        const data = await uploadResumeAndMatchJD(resumeFile, jdText, user?._id);
        setResults(data);
    } catch (err) {
        console.error("Error matching JD:", err);
        setError("Failed to analyze resume. Please ensure the backend is running.");
    } finally {
        setLoading(false);
    }
  };

  const handleMatchTitle = async () => {
    if (!resumeFile || !jobTitle) return alert("Please provide both a resume and a job title.");
    setLoading(true);
    setError("");
    setResults(null);
    try {
        const data = await uploadResumeAndMatchTitle(resumeFile, jobTitle, user?._id);
        setResults(data);
    } catch (err) {
        console.error("Error matching title:", err);
        setError("Failed to analyze resume. Please ensure the backend is running.");
    } finally {
        setLoading(false);
    }
  };

  const handleFetchHistory = async () => {
    try {
        const data = await fetchMatchHistory(user?._id);
        setHistory(data.history);
    } catch (err) {
        console.error("Error fetching history:", err);
    }
  };

  const handleViewHistoryItem = (item) => {
      setResults(item);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
             <FileText className="text-white" size={32} />
          </div>
          <div>
             <h2 className="text-3xl font-bold text-gray-900">AI Resume Analyzer</h2>
             <p className="text-gray-500">Get detailed feedback, ATS scores, and improvement tips.</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-2">
             <AlertCircle size={20} />
             {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Upload & Inputs */}
            <div className="lg:col-span-12 space-y-6">
                
                {/* Step 1: Upload */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                        Upload Resume
                    </h3>
                    
                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group
                        ${resumeFile 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {resumeFile ? (
                                <>
                                    <div className="p-2 bg-green-100 rounded-full mb-3">
                                        <FileCheck className="text-green-600" size={32} />
                                    </div>
                                    <p className="text-sm text-green-700 font-bold">{resumeFile.name}</p>
                                    <p className="text-xs text-green-600 mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button 
                                      onClick={(e) => { e.preventDefault(); setResumeFile(null); }}
                                      className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium z-10"
                                    >
                                      Remove File
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="p-2 bg-white rounded-full mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                        <UploadCloud className="text-blue-500" size={32} />
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-400">PDF or DOCX (MAX. 5MB)</p>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.docx"
                            onChange={(e) => setResumeFile(e.target.files[0])} 
                        />
                    </label>
                </div>

                {/* Step 2: Choose Analysis Method */}
                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Option: JD Match */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <Briefcase size={20} className="text-indigo-500"/>
                                Match with Job Description
                            </h3>
                            <p className="text-xs text-gray-500">Paste the full JD to get a precise match score and keywords analysis.</p>
                        </div>
                        <textarea
                            placeholder="Paste job description here..."
                            className="w-full border border-gray-200 rounded-xl p-4 text-sm flex-grow focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none bg-gray-50 mb-4"
                            rows={6}
                            value={jdText}
                            onChange={(e) => setJdText(e.target.value)}
                        />
                        <button
                            className={`w-full py-3 rounded-xl font-medium flex justify-center items-center shadow-sm transition-all
                                ${!resumeFile || !jdText 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                                }`}
                            onClick={handleMatchJD}
                            disabled={loading || !resumeFile || !jdText}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    Analyzing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Analyze Match <ChevronRight size={16}/>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Option: Title Match */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <Search size={20} className="text-emerald-500"/>
                                Quick Check by Role
                            </h3>
                            <p className="text-xs text-gray-500 mb-6">Compare against general industry standards for a specific role.</p>
                            
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Target Job Title</label>
                            <input
                                placeholder="e.g. Senior Frontend Developer"
                                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none bg-gray-50"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>
                        <button
                            className={`w-full py-3 mt-6 rounded-xl font-medium flex justify-center items-center shadow-sm transition-all
                                ${!resumeFile || !jobTitle 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                                }`}
                            onClick={handleMatchTitle}
                            disabled={loading || !resumeFile || !jobTitle}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    Analyzing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Quick Analyze <ChevronRight size={16}/>
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Result Section */}
        {results && (
            <div className="animate-fade-in-up">
                <AnalysisResult result={results} />
            </div>
        )}

        {/* History Section */}
        <div className="border-t border-gray-200 pt-10">
            <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <History size={24} className="text-gray-400" />
                    Analysis History
                 </h3>
                 <button
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                    onClick={handleFetchHistory}
                >
                    Refresh History
                </button>
            </div>

            {history.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => (
                        <div 
                            key={item._id} 
                            onClick={() => handleViewHistoryItem(item)}
                            className="group cursor-pointer bg-white border border-gray-200 p-5 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                        ${item.type === 'job-title' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {item.type.replace('-', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
                                    {item.analysis?.analysis_summary || item.generated_description || "Detailed Resume Analysis Report"}
                                </h4>
                            </div>

                            <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase mb-0.5">Match Score</p>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={16} className={item.match_score >= 70 ? 'text-green-500' : 'text-yellow-500'} />
                                        <span className={`text-xl font-bold ${
                                            (item.match_score) >= 70 ? 'text-green-600' : 
                                            (item.match_score) >= 40 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                            {item.match_score}%
                                        </span>
                                    </div>
                                </div>
                                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                                    <ChevronRight size={20} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                    <History size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No analysis history found.</p>
                    <button onClick={handleFetchHistory} className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                        Check for past reports
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Wrapper with Auth Provider
export default function ResumeAnalyzer() {
  const [user] = useState({ _id: '123', name: 'Demo User' });
  return (
    <AuthContext.Provider value={{ user }}>
      <ResumeAnalyzerContent />
    </AuthContext.Provider>
  );
}
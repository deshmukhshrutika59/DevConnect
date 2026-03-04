
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Flame, 
  Activity,
  BarChart2,
  PieChart as PieIcon,
  Eye,
  Share2,
  ThumbsUp
} from "lucide-react";

const Analytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Fetch AI Insights (UNCHANGED)
  const fetchInsights = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setInsights(d.insights || []);
    } catch (err) {
      console.error("Insights error:", err);
      setInsights(["Unable to fetch AI insights currently."]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchInsights();
  }, [token]);

  // 🔹 Fetch main analytics data (UNCHANGED)
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetch(`${import.meta.env.VITE_API_BASE_URL}/analytics/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const txt = await res.text();
        try {
          return txt ? JSON.parse(txt) : {};
        } catch {
          return {};
        }
      })
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Analytics error:", err);
        setError("Failed to load analytics.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
            <Activity className="animate-spin text-indigo-600" size={32} />
            <p className="text-gray-500 font-medium">Crunching the numbers...</p>
        </div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center bg-red-50 text-red-600 border border-red-200 rounded-xl m-6">
        <p className="font-bold">Error loading analytics</p>
        <p className="text-sm">{error}</p>
    </div>
  );

  if (!data) return <div className="p-6 text-gray-500 text-center">No analytics data available.</div>;

  const {
    stats = {},
    postMetrics = [],
    views30 = [],
    connections30 = [],
    skillBreakdown = [],
  } = data;

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
  const totalViewsLast30 = safeArray(views30).reduce((a, b) => a + (b.count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Brain className="text-indigo-600" size={24} /> 
                        </div>
                        Analytics Dashboard
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 ml-11">Track your growth and engagement metrics</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    title="Profile Views (30d)" 
                    value={totalViewsLast30} 
                    icon={<Eye size={20} className="text-blue-500"/>} 
                    trend="+12%" // Static trend for visual example
                />
                <Card 
                    title="Total Connections" 
                    value={stats.totalConnections ?? 0} 
                    icon={<Users size={20} className="text-green-500"/>} 
                />
                <Card 
                    title="Total Posts" 
                    value={stats.totalPosts ?? 0} 
                    icon={<Activity size={20} className="text-purple-500"/>} 
                />
                <Card 
                    title="Avg Engagement" 
                    value={(stats.avgEngagement ?? 0).toFixed(1)} 
                    icon={<ThumbsUp size={20} className="text-orange-500"/>} 
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Post Performance (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    <Section title="Post Performance" icon={<BarChart2 size={18}/>}>
                        <div className="mb-6">
                             <BarChart data={safeArray(postMetrics)} />
                        </div>
                        <PostsTable posts={safeArray(postMetrics)} />
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Section title="Profile Views (30 Days)" icon={<TrendingUp size={18}/>}>
                            <LineChart data={safeArray(views30)} color="#3B82F6" />
                        </Section>
                        <Section title="Connection Growth" icon={<Users size={18}/>}>
                            <LineChart data={safeArray(connections30)} color="#10B981" />
                        </Section>
                    </div>
                </div>

                {/* Right Col: Skills & Insights (Span 1) */}
                <div className="space-y-6">
                    
                    {/* Skills Pie Chart */}
                    <Section title="Audience Skills" icon={<PieIcon size={18}/>}>
                        <div className="flex justify-center py-4">
                            <PieChart data={safeArray(skillBreakdown)} />
                        </div>
                        {/* Legend */}
                        <div className="mt-4 space-y-2">
                             {safeArray(skillBreakdown).slice(0, 5).map((item, i) => (
                                 <div key={i} className="flex items-center justify-between text-sm">
                                     <div className="flex items-center gap-2">
                                         <span className="w-3 h-3 rounded-full" style={{backgroundColor: `hsl(${(i * 40) % 360}, 70%, 60%)`}}></span>
                                         <span className="text-gray-600">{item._id || "Unknown"}</span>
                                     </div>
                                     <span className="font-semibold text-gray-900">{item.count}</span>
                                 </div>
                             ))}
                        </div>
                    </Section>

                    {/* AI Insights Panel */}
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Brain size={20} className="text-indigo-300"/> 
                                AI Insights
                            </h3>
                            <button
                                onClick={fetchInsights}
                                disabled={refreshing}
                                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                                    refreshing 
                                    ? "bg-white/10 text-white/50 cursor-not-allowed" 
                                    : "bg-white/20 hover:bg-white/30 text-white"
                                }`}
                            >
                                {refreshing ? "Thinking..." : "Refresh"}
                            </button>
                        </div>

                        {insights.length === 0 ? (
                            <div className="text-center py-8 text-indigo-200">
                                <Activity className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Click refresh to generate AI analysis of your profile.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {insights.slice(0, 4).map((tip, i) => (
                                    <InsightCard key={i} index={i} text={tip} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

/* ---------- COMPONENTS ---------- */

const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6 flex-1">
        {children}
    </div>
  </div>
);

const Card = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
            {icon}
        </div>
    </div>
    {trend && (
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded">
            <TrendingUp size={12} /> {trend}
        </div>
    )}
  </div>
);

const InsightCard = ({ text, index }) => {
  const icons = [TrendingUp, Users, MessageSquare, Flame];
  const Icon = icons[index % icons.length];
  // Slightly transparent backgrounds for the dark theme container
  const colors = ["bg-indigo-500/20 text-indigo-100", "bg-blue-500/20 text-blue-100", "bg-green-500/20 text-green-100", "bg-yellow-500/20 text-yellow-100"];
  
  return (
    <div className={`flex gap-3 p-3 rounded-lg text-sm leading-relaxed backdrop-blur-sm ${colors[index % 4]} border border-white/5`}>
      <Icon className="shrink-0 mt-0.5 opacity-80" size={16} />
      <p>{text}</p>
    </div>
  );
};

/* ---------- CHARTS (Visual Wrappers Only - Logic Unchanged) ---------- */

const BarChart = ({ data }) => {
  if (!data || data.length === 0)
    return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No post data available</div>;
  
  const width = 600;
  const height = 200;
  const totals = data.map((p) => (p.likes || 0) + (p.comments || 0) + (p.shares || 0));
  const max = Math.max(...totals, 1);
  
  return (
    <div className="w-full h-full min-h-[200px]">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {data.map((p, i) => {
            const total = (p.likes || 0) + (p.comments || 0) + (p.shares || 0);
            const barHeight = (total / max) * (height - 30);
            const x = i * (width / data.length) + 20; // Added some left padding
            const y = height - barHeight - 20;
            return (
            <g key={i} className="group">
                {/* Tooltip-ish background on hover */}
                <rect width="40" height={height} x={x - 5} y={0} fill="transparent" className="group-hover:fill-gray-50 transition-colors" />
                <rect 
                    width="30" 
                    height={Math.max(barHeight, 4)} 
                    x={x} 
                    y={y} 
                    fill="#6366F1" 
                    rx="4"
                    className="group-hover:fill-indigo-500 transition-colors"
                />
                <text x={x} y={height} fontSize="12" fill="#6B7280" className="font-sans">
                {String(p.title || "Untitled").slice(0, 6)}..
                </text>
                {/* Value Label */}
                <text x={x + 5} y={y - 5} fontSize="10" fill="#6366F1" fontWeight="bold">
                    {total > 0 ? total : ""}
                </text>
            </g>
            );
        })}
        </svg>
    </div>
  );
};

const LineChart = ({ data, color = "#3B82F6" }) => {
  if (!data || data.length === 0)
    return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No trend data available</div>;
  
  const arr = Array.isArray(data) ? data : [];
  const width = 600;
  const height = 200;
  const counts = arr.map((d) => d.count || 0);
  const max = Math.max(...counts, 1);
  
  const points = arr
    .map((d, i) => {
      const x = (i / Math.max(arr.length - 1, 1)) * width;
      const y = height - ((d.count || 0) / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full h-full min-h-[150px]">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Grid lines (Visual fake) */}
            <line x1="0" y1={height} x2={width} y2={height} stroke="#E5E7EB" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2={height} stroke="#E5E7EB" strokeWidth="1" />
            
            {/* The Line */}
            <polyline 
                fill="none" 
                stroke={color} 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points} 
                className="drop-shadow-sm"
            />
        </svg>
    </div>
  );
};

const PieChart = ({ data }) => {
  if (!data || data.length === 0)
    return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No skills data available</div>;
  
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0) || 1;
  let angleStart = 0;
  
  return (
    <div className="relative w-48 h-48">
        <svg width="100%" height="100%" viewBox="0 0 300 300" className="rotate-[-90deg]">
        {data.map((item, i) => {
            const angle = ((item.count || 0) / total) * 360;
            // Avoid errors if angle is 360 or 0
            if (angle === 0) return null;
            const largeArc = angle > 180 ? 1 : 0;
            const x1 = 150 + 120 * Math.cos((angleStart * Math.PI) / 180);
            const y1 = 150 + 120 * Math.sin((angleStart * Math.PI) / 180);
            const x2 = 150 + 120 * Math.cos(((angleStart + angle) * Math.PI) / 180);
            const y2 = 150 + 120 * Math.sin(((angleStart + angle) * Math.PI) / 180);
            
            // If full circle, handle differently (simplified for SVG paths)
            const path = angle >= 360 
                ? `M 150, 150 m -120, 0 a 120,120 0 1,0 240,0 a 120,120 0 1,0 -240,0`
                : `M150,150 L${x1},${y1} A120,120 0 ${largeArc} 1 ${x2},${y2} Z`;

            angleStart += angle;
            return (
            <path 
                key={i} 
                d={path} 
                fill={`hsl(${(i * 40) % 360}, 70%, 60%)`} 
                stroke="white" 
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            );
        })}
        </svg>
        {/* Center Hole for Donut Chart effect (optional, removed for now to keep logic simple) */}
    </div>
  );
};

const PostsTable = ({ posts }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-500 font-medium">
        <tr>
          <th className="p-3">Post Title</th>
          <th className="p-3 text-center">
             <div className="flex items-center gap-1 justify-center"><ThumbsUp size={14}/> Likes</div>
          </th>
          <th className="p-3 text-center">
             <div className="flex items-center gap-1 justify-center"><MessageSquare size={14}/> Comments</div>
          </th>
          <th className="p-3 text-center">
             <div className="flex items-center gap-1 justify-center"><Share2 size={14}/> Shares</div>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {posts.map((p, i) => (
          <tr key={i} className="hover:bg-gray-50 transition-colors">
            <td className="p-3 font-medium text-gray-800">{p.title || "Untitled Post"}</td>
            <td className="p-3 text-center text-gray-600">{p.likes ?? 0}</td>
            <td className="p-3 text-center text-gray-600">{p.comments ?? 0}</td>
            <td className="p-3 text-center text-gray-600">{p.shares ?? 0}</td>
          </tr>
        ))}
        {posts.length === 0 && (
             <tr>
                 <td colSpan="4" className="p-4 text-center text-gray-400">No posts found</td>
             </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default Analytics;
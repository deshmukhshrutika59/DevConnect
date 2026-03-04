// // // src/pages/AiAssistant.jsx

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../contexts/AuthContext";
import {
    Bot,
    User,
    Send,
    Paperclip,
    X,
    Sparkles,
    FileText,
    History
} from "lucide-react";

export default function AiAssistant() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            from: "bot",
            text: `Hi ${user?.name || "Developer"}! 👋 \nI'm your AI Career Coach. \n\nYou can:\n1. Upload your resume for a review\n2. Share your GitHub link for analysis\n3. Ask for interview prep`,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Helper to get robust User ID
    const getUserId = () => user?._id || user?.id || "guest_user";

    // 1. Load History on Mount
    useEffect(() => {
        const uid = getUserId();
        if (uid && uid !== "guest_user") {
            console.log("Fetching history for user:", uid);
            fetch(`${import.meta.env.VITE_RESUME_API_URL}/api/ai/history/${uid}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch history");
                    return res.json();
                })
                .then(data => {
                    if (data.history && Array.isArray(data.history) && data.history.length > 0) {
                        setMessages(data.history);
                    }
                })
                .catch(err => console.error("History fetch error:", err));
        }
    }, [user]); // Re-run if user object changes (e.g. login)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileSelect = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() && !selectedFile) return;

        const userMsg = {
            from: "user",
            text: input,
            file: selectedFile ? `📎 ${selectedFile.name}` : null
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        setInput("");

        const formData = new FormData();
        formData.append("message", input || "Please analyze this file.");
        formData.append("userId", getUserId()); // ✅ Use robust ID check

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        try {
            // ✅ Explicitly log what we are sending for debugging
            console.log("Sending AI request for:", getUserId());

            const res = await fetch(`${import.meta.env.VITE_RESUME_API_URL}/api/ai/chat`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(`Server responded with ${res.status}`);

            const data = await res.json();

            if (data.reply) {
                setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { from: "bot", text: "⚠️ Error: No response from AI." }]);
            }
        } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, { from: "bot", text: "❌ Connection failed. Please ensure the Python backend is running on port 8000." }]);
        } finally {
            setLoading(false);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto p-4 md:p-6 font-sans">

            {/* HEADER */}
            <div className="bg-white border border-gray-200 rounded-t-2xl p-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Bot className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            DevConnect Career AI
                            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                                Beta
                            </span>
                        </h1>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online • Powered by Gemini 2.0
                        </p>
                    </div>
                </div>
                {getUserId() === "guest_user" && (
                    <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                        <History size={12} /> Chats not saved (Guest)
                    </div>
                )}
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 border-x border-gray-200 bg-gray-50/50 p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {messages.map((m, idx) => {
                    const isUser = m.from === "user";
                    return (
                        <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>

                            {/* Bot Avatar */}
                            {!isUser && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 mt-1">
                                    <Sparkles size={14} className="text-blue-600" />
                                </div>
                            )}

                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                                {/* File Attachment Bubble */}
                                {m.file && (
                                    <div className={`mb-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border ${isUser ? "bg-blue-700 text-blue-100 border-blue-600" : "bg-white text-gray-600 border-gray-200"
                                        }`}>
                                        <FileText size={14} />
                                        {m.file.replace("📎 ", "")}
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div className={`px-4 py-3 shadow-sm ${isUser
                                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                    : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-sm"
                                    }`}>
                                    <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${isUser ? "prose-invert" : "text-gray-800"}`}>
                                        <ReactMarkdown>{m.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* User Avatar */}
                            {isUser && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 mt-1">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="me" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="text-gray-500" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                            <Sparkles size={14} className="text-blue-600 animate-spin" />
                        </div>
                        <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Analyzing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl p-4 shadow-sm">
                <form onSubmit={sendMessage} className="relative flex flex-col gap-2">

                    {/* File Preview Chip */}
                    {selectedFile && (
                        <div className="absolute -top-12 left-0 animate-fade-in-up">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-2 shadow-sm">
                                <Paperclip size={12} />
                                <span className="max-w-[200px] truncate">{selectedFile.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFile(null)}
                                    className="hover:bg-blue-100 rounded-full p-0.5 transition"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                        {/* File Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            title="Upload Resume or Code"
                        >
                            <Paperclip size={20} />
                        </button>

                        {/* Textarea */}
                        <textarea
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 text-sm py-2.5 max-h-32 resize-none placeholder-gray-400"
                            rows="1"
                            placeholder="Ask about your resume, interview prep, or paste code..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                        />

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={loading || (!input.trim() && !selectedFile)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
}
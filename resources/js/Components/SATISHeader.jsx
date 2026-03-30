import React from "react";
import { Bell, Sun } from "lucide-react";
import systemLogo from "../../assets/system-logo.png";

export default function SATISHeader({ user }) {
    return (
        <header className="flex items-center justify-between w-full px-6 py-2 bg-white border-b border-slate-200 shadow-sm min-h-[56px]">
            {/* Logo and System Name */}

            <div className="flex items-center gap-3 min-w-0">
                <div>
                    <img
                        src={systemLogo}
                        alt="System Logo"
                        className="h-8 w-8 rounded-full object-cover"
                    />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-lg tracking-tight text-slate-800">
                        SATIS<span className="text-indigo-500">-FACTION</span>
                    </span>
                    <span className="uppercase text-[10px] tracking-widest text-slate-400 font-semibold leading-tight">
                        Smart Academic Tracking and Intervention System
                    </span>
                </div>
            </div>

            {/* Right side: actions and user */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Bell size={18} className="text-slate-500" />
                    {/* Notification dot */}
                    <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Sun size={18} className="text-slate-500" />
                </button>
                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-2 py-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-sm">
                        {user?.initials || "SA"}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-slate-800 truncate max-w-[80px]">
                            {user?.name || "User"}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight">
                            {user?.role || "Superadmin"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

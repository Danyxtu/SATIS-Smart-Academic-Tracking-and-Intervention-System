import React, { useState } from "react";
import TeacherLayout from "@/Layouts/TeacherLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useLoading } from "@/Context/LoadingContext";
import {
    Users,
    AlertTriangle,
    ClipboardList,
    MessageSquare,
    UploadCloud,
    FileUp,
    TrendingDown,
    X,
    CheckCircle2,
} from "lucide-react";

import StudentRiskCard from "@/Components/StudentRiskCard";
import StatCard from "@/Components/StatCard";
import ActivityFeedItem from "@/Components/ActivityFeedItem";
import GradeUploader from "@/Components/GradeUploader";

// 3. Recent Activity Feed Item

// 4. The Grade Sheet Uploader

const mockActivity = [
    {
        icon: FileUp,
        text: "You uploaded grades for <strong>Grade 12 - STEM</strong>.",
        time: "2 hours ago",
        iconBgColor: "bg-indigo-500",
    },
    {
        icon: ClipboardList,
        text: "You started an intervention for <strong>John Smith</strong>.",
        time: "5 hours ago",
        iconBgColor: "bg-yellow-500",
    },
    {
        icon: CheckCircle2,
        text: '<strong>Maria Clara</strong> completed task: "Review Module 3".',
        time: "1 day ago",
        iconBgColor: "bg-green-500",
    },
];

// --- Main Dashboard Page Component ---
export default function Dashboard({ user, students, totalStudents }) {
    const { auth } = usePage().props;
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const stats = [
        {
            title: "Total Students",
            value: totalStudents,
            icon: Users,
            iconBgColor: "bg-indigo-500",
        },
        {
            title: "Students at Risk",
            value: students.filter((s) => s.grade < 75).length,
            icon: AlertTriangle,
            iconBgColor: "bg-red-500",
        },
        {
            title: "Interventions Active",
            value: "5", // Replace with real data
            icon: ClipboardList,
            iconBgColor: "bg-yellow-500",
        },
        {
            title: "Feedback Sent (7d)",
            value: "31", // Replace with real data
            icon: MessageSquare,
            iconBgColor: "bg-blue-500",
        },
    ];

    const atRiskStudents = students.filter((student) => student.grade < 75);

    return (
        <TeacherLayout>
            <Head title="Teacher Dashboard" />

            {/* 1. Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome Back, {auth.user.name}!
                </h1>
                <p className="text-lg text-gray-600">
                    Here's your overview for {currentDate}.
                </p>
            </div>

            {/* 2. Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* 3. Main Content (2-col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* 3a. Left Column (Students at Risk) */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" />
                        High Priority: Students at Risk
                    </h2>
                    <div className="bg-.jsx rounded-xl shadow-lg p-6 space-y-4">
                        {atRiskStudents.length > 0 ? (
                            atRiskStudents.map((student) => (
                                <StudentRiskCard
                                    key={student.id}
                                    student={student}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                No students are currently flagged as "at-risk".
                                Great job!
                            </p>
                        )}
                    </div>
                </div>

                {/* 3b. Right Column (Recent Activity) */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Recent Activity
                    </h2>
                    <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
                        {mockActivity.map((item, index) => (
                            <ActivityFeedItem key={index} {...item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Uploader (Full Width) */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Upload New Grade Sheet
                </h2>
                <GradeUploader />
            </div>
        </TeacherLayout>
    );
}

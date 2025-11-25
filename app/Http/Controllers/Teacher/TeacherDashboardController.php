<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class TeacherDashboardController extends Controller
{
    /**
     * Display the teacher's dashboard.
     */
    public function index()
    {
        $teacher = Auth::user();

        // --- THIS IS THE "BACKEND-READY" PART ---
        // Instead of complex DB queries, we pass hard-coded mock data.
        // Our React component will be built to receive these exact props.
        // Later, we just replace this mock array with our real data.

        // Mock data for the 4 top stat cards
        $stats = [
            ['title' => 'Total Students', 'value' => '184', 'icon' => 'Users', 'color' => 'bg-indigo-500'],
            ['title' => 'Students at Risk', 'value' => '12', 'icon' => 'AlertTriangle', 'color' => 'bg-red-500'],
            ['title' => 'Interventions Active', 'value' => '5', 'icon' => 'ClipboardList', 'color' => 'bg-yellow-500'],
            ['title' => 'Feedback Sent (7d)', 'value' => '31', 'icon' => 'MessageSquare', 'color' => 'bg-blue-500'],
        ];

        // Mock data for the "High Priority" list
        $atRiskStudents = [
            ['id' => 1, 'name' => 'Sheena De Guzman', 'subject' => 'Physics', 'grade' => 68, 'trend' => 'Declining', 'avatar' => 'https://placehold.co/40x40/E9D5FF/4C1D95?text=SD', 'interventionUrl' => '#'],
            ['id' => 2, 'name' => 'John Smith', 'subject' => 'Mathematics', 'grade' => 71, 'trend' => 'Declining', 'avatar' => 'https://placehold.co/40x40/DBEAFE/1E3A8A?text=JS', 'interventionUrl' => '#'],
            ['id' => 3, 'name' => 'Maria Clara', 'subject' => 'Physics', 'grade' => 73, 'trend' => 'Stable', 'avatar' => 'https://placehold.co/40x40/FEE2E2/991B1B?text=MC', 'interventionUrl' => '#'],
        ];

        // Mock data for the "Recent Activity" feed
        $recentActivity = [
            ['id' => 1, 'icon' => 'FileUp', 'text' => 'You uploaded grades for <strong>Grade 12 - STEM</strong>.', 'time' => '2 hours ago', 'color' => 'bg-indigo-500'],
            ['id' => 2, 'icon' => 'ClipboardList', 'text' => 'You started an intervention for <strong>John Smith</strong>.', 'time' => '5 hours ago', 'color' => 'bg-yellow-500'],
            ['id' => 3, 'icon' => 'CheckCircle2', 'text' => '<strong>Maria Clara</strong> completed task: "Review Module 3".', 'time' => '1 day ago', 'color' => 'bg-green-500'],
        ];

        // Mock data for the subjects dropdown in the uploader
        $subjects = [
            ['id' => 1, 'name' => 'G12-STEM Physics'],
            ['id' => 2, 'name' => 'G12-ABM Calculus'],
            ['id' => 3, 'name' => 'G11-HUMSS Philosophy'],
        ];

        return Inertia::render('Teacher/Dashboard', [
            'stats' => $stats,
            'atRiskStudents' => $atRiskStudents,
            'recentActivity' => $recentActivity,
            'subjects' => $subjects,
        ]);
    }
}
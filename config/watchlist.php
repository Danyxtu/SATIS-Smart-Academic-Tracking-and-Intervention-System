<?php

return [
    // Shared passing threshold used by high-risk and decline checks.
    'passing_grade' => 75.0,

    // High risk (At Risk): grade below 75 OR absences >= 5.
    'high_risk' => [
        'absence_threshold' => 5,
    ],

    // Medium risk (Needs Attention): absences > 3 OR failing activities > 3.
    'needs_attention' => [
        'absence_threshold' => 3,
        'failing_activities_threshold' => 3,
    ],

    // Low risk (Recent Decline): decline from midterm to final quarter using
    // percentage drop, with optional requirement that final quarter is failing.
    'recent_decline' => [
        'minimum_drop_percent' => 20.0,
        'require_final_quarter_failing' => true,
    ],
];

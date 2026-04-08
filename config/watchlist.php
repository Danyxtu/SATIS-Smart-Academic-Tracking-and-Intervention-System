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

    // Low risk (Recent Decline): high midterm baseline, downward trend,
    // and decline signals that are currently static defaults.
    'recent_decline' => [
        'midterm_baseline_grade' => 85.0,
        'minimum_drop_points' => 10.0,
        'massive_drop_percent' => 20.0,
        'non_failing_floor' => 75.0,
        'final_quarter_failing_activities_threshold' => 3,
    ],
];

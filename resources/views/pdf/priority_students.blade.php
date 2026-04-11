<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Priority Students Report</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                color: #000;
                margin: 0;
                padding: 20px;
            }

            .header {
                text-align: left;
                margin-bottom: 18px;
                border-bottom: 2px solid #5b21b6;
                padding-bottom: 12px;
            }

            .report-type {
                font-size: 16px;
                font-weight: 700;
                color: #312e81;
                margin-top: 6px;
            }

            .date-info {
                font-size: 11px;
                color: #475569;
                margin-top: 3px;
            }

            .teacher-info {
                margin-top: 10px;
                margin-bottom: 10px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                overflow: hidden;
            }

            .teacher-info-title {
                background: #eef2ff;
                color: #312e81;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                padding: 7px 10px;
                border-bottom: 1px solid #cbd5e1;
            }

            .meta-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
            }

            .meta-table td {
                border: 1px solid #e2e8f0;
                padding: 6px 8px;
                font-size: 10.5px;
                text-align: left;
                vertical-align: top;
            }

            .meta-label {
                color: #475569;
                font-weight: 600;
                width: 22%;
                background: #f8fafc;
            }

            .section-header {
                background: #e5e7eb;
                padding: 10px 14px;
                margin: 16px 0 8px 0;
                font-size: 13px;
                font-weight: 700;
                border-left: 4px solid #6b7280;
            }

            .section-header.critical {
                background: #fee2e2;
                border-left-color: #dc2626;
                color: #991b1b;
            }

            .section-header.warning {
                background: #fef3c7;
                border-left-color: #f59e0b;
                color: #92400e;
            }

            .section-header.watchlist {
                background: #dbeafe;
                border-left-color: #3b82f6;
                color: #1e40af;
            }

            .section-count {
                font-size: 11px;
                font-weight: 400;
                color: #475569;
            }

            .criteria-note {
                font-size: 10px;
                color: #475569;
                margin: 0 0 8px 0;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 16px;
            }

            th,
            td {
                border: 1px solid #d1d5db;
                padding: 7px 9px;
                text-align: left;
                vertical-align: middle;
            }

            th {
                background: #f8fafc;
                font-weight: 700;
                font-size: 10px;
                text-transform: uppercase;
                color: #334155;
                text-align: center;
                letter-spacing: 0.3px;
            }

            .name {
                font-weight: 600;
            }

            .subject {
                font-size: 10px;
                color: #475569;
            }

            .grade {
                text-align: center;
                font-weight: 700;
            }

            .grade.critical {
                color: #dc2626;
            }

            .grade.warning {
                color: #d97706;
            }

            .grade.watchlist {
                color: #2563eb;
            }

            .center {
                text-align: center;
            }

            .no-students {
                text-align: center;
                padding: 14px;
                color: #64748b;
                font-style: italic;
                border: 1px dashed #cbd5e1;
                border-radius: 6px;
                margin-bottom: 16px;
                background: #f8fafc;
            }

            .summary-section {
                margin-top: 18px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                overflow: hidden;
            }

            .summary-header-bar {
                background: #312e81;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                padding: 10px 14px;
            }

            .summary-meta {
                background: #eef2ff;
                color: #1e1b4b;
                font-size: 10px;
                padding: 8px 14px;
                border-bottom: 1px solid #cbd5e1;
            }

            .summary-table {
                margin-bottom: 0;
            }

            .summary-table td {
                font-size: 10.5px;
                vertical-align: top;
            }

            .summary-table td.center {
                text-align: center;
                vertical-align: middle;
            }

            .summary-total-row td {
                background: #f1f5f9;
                font-weight: 700;
            }

            .badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 999px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .badge.enabled {
                background: #dcfce7;
                color: #166534;
            }

            .badge.disabled {
                background: #fee2e2;
                color: #991b1b;
            }

            .priority-high {
                color: #991b1b;
                font-weight: 600;
            }

            .priority-medium {
                color: #92400e;
                font-weight: 600;
            }

            .priority-monitor {
                color: #1e3a8a;
                font-weight: 600;
            }

            .recommendations {
                margin-top: 0;
                background: #f8fafc;
                border-top: 1px solid #cbd5e1;
                padding: 12px 14px;
            }

            .recommendations-title {
                font-size: 12px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1e293b;
                text-transform: uppercase;
                letter-spacing: 0.4px;
            }

            .recommendations-list {
                margin: 0;
                padding-left: 20px;
            }

            .recommendations-list li {
                margin-bottom: 4px;
                font-size: 10.5px;
            }

            .footer {
                margin-top: 20px;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
                font-size: 10px;
                color: #6b7280;
                text-align: left;
            }
        </style>
    </head>
    <body>
        @php
            $ruleConfig = (array) ($watchlistRuleConfig ?? []);
            $observedCategories = (array) ($watchlistObservedCategories ?? []);

            $observeAtRisk = (bool) data_get($observedCategories, 'at_risk', true);
            $observeNeedsAttention = (bool) data_get($observedCategories, 'needs_attention', true);
            $observeRecentDecline = (bool) data_get($observedCategories, 'recent_decline', true);

            $passingGrade = (float) data_get($ruleConfig, 'passing_grade', 75.0);
            $atRiskAbsenceThreshold = (int) data_get($ruleConfig, 'high_risk.absence_threshold', 5);
            $needsAttentionAbsenceThreshold = (int) data_get($ruleConfig, 'needs_attention.absence_threshold', 3);
            $needsAttentionFailingActivitiesThreshold = (int) data_get(
                $ruleConfig,
                'needs_attention.failing_activities_threshold',
                3,
            );
            $recentDeclineMinDropPercent = (float) data_get($ruleConfig, 'recent_decline.minimum_drop_percent', 20.0);
            $recentDeclineRequiresFailingQuarter = (bool) data_get(
                $ruleConfig,
                'recent_decline.require_final_quarter_failing',
                true,
            );

            $formatNumber = static function (float|int $value): string {
                if ((float) ((int) $value) === (float) $value) {
                    return (string) ((int) $value);
                }

                return rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.');
            };

            $atRiskCriteria = 'Grade < ' . $formatNumber($passingGrade) . '% or absences >= ' . $atRiskAbsenceThreshold;
            $needsAttentionCriteria = 'Absences > ' . $needsAttentionAbsenceThreshold
                . ' or failing activities > ' . $needsAttentionFailingActivitiesThreshold;
            $recentDeclineCriteria = $recentDeclineRequiresFailingQuarter
                ? 'Decline >= ' . $formatNumber($recentDeclineMinDropPercent) . '% and final quarter failing'
                : 'Decline >= ' . $formatNumber($recentDeclineMinDropPercent) . '% from midterm';

            $atRiskIncludedCount = $includeAtRisk ? count($atRiskStudents) : 0;
            $needsAttentionIncludedCount = $includeNeedsAttention ? count($needsAttentionStudents) : 0;
            $recentDeclineIncludedCount = $includeRecentDecline ? count($recentDeclineStudents) : 0;
            $totalIncludedCount = $atRiskIncludedCount + $needsAttentionIncludedCount + $recentDeclineIncludedCount;
        @endphp

        <div class="header">
            @include('pdf.partials.standard_header')
            <div class="report-type">Priority Students Report</div>
            <div class="date-info">Generated on {{ \Illuminate\Support\Carbon::now('Asia/Manila')->format('F d, Y \a\t h:i A') }}</div>
        </div>

        <div class="teacher-info">
            <div class="teacher-info-title">Report Metadata</div>
            <table class="meta-table">
                <tbody>
                    <tr>
                        <td class="meta-label">Teacher</td>
                        <td>{{ $teacher['name'] }}</td>
                        <td class="meta-label">Department</td>
                        <td>{{ $department['name'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Academic Period</td>
                        <td>
                            @if($academicPeriod)
                                S.Y. {{ $academicPeriod['schoolYear'] }} - {{ $academicPeriod['semester'] == 1 ? '1st' : '2nd' }} Semester
                            @else
                                N/A
                            @endif
                        </td>
                        <td class="meta-label">Class Settings</td>
                        <td>
                            At Risk: {{ $observeAtRisk ? 'Enabled' : 'Hidden' }} |
                            Needs Attention: {{ $observeNeedsAttention ? 'Enabled' : 'Hidden' }} |
                            Recent Declines: {{ $observeRecentDecline ? 'Enabled' : 'Hidden' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        @if($includeAtRisk)
            <div class="section-header critical">
                At Risks <span class="section-count">- {{ count($atRiskStudents) }} student(s)</span>
            </div>
            <p class="criteria-note">{{ $atRiskCriteria }}</p>

            @if(count($atRiskStudents) > 0)
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 30%;">Student Name</th>
                            <th style="width: 20%;">Section</th>
                            <th style="width: 25%;">Subject</th>
                            <th style="width: 10%;">Grade</th>
                            <th style="width: 10%;">Absences</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($atRiskStudents as $index => $student)
                            <tr>
                                <td class="center">{{ $index + 1 }}</td>
                                <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                                <td>{{ $student['section'] ?? 'N/A' }}</td>
                                <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                                <td class="grade critical">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                                <td class="center">{{ $student['absences'] ?? 0 }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div class="no-students">No students currently in critical status.</div>
            @endif
        @endif

        @if($includeNeedsAttention)
            <div class="section-header warning">
                Needs Attention <span class="section-count">- {{ count($needsAttentionStudents) }} student(s)</span>
            </div>
            <p class="criteria-note">{{ $needsAttentionCriteria }}</p>

            @if(count($needsAttentionStudents) > 0)
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 30%;">Student Name</th>
                            <th style="width: 20%;">Section</th>
                            <th style="width: 25%;">Subject</th>
                            <th style="width: 10%;">Grade</th>
                            <th style="width: 10%;">Absences</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($needsAttentionStudents as $index => $student)
                            <tr>
                                <td class="center">{{ $index + 1 }}</td>
                                <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                                <td>{{ $student['section'] ?? 'N/A' }}</td>
                                <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                                <td class="grade warning">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                                <td class="center">{{ $student['absences'] ?? 0 }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div class="no-students">No students currently under Needs Attention.</div>
            @endif
        @endif

        @if($includeRecentDecline)
            <div class="section-header watchlist">
                Recent Declines <span class="section-count">- {{ count($recentDeclineStudents) }} student(s)</span>
            </div>
            <p class="criteria-note">{{ $recentDeclineCriteria }}</p>

            @if(count($recentDeclineStudents) > 0)
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 30%;">Student Name</th>
                            <th style="width: 20%;">Section</th>
                            <th style="width: 25%;">Subject</th>
                            <th style="width: 10%;">Grade</th>
                            <th style="width: 10%;">Absences</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($recentDeclineStudents as $index => $student)
                            <tr>
                                <td class="center">{{ $index + 1 }}</td>
                                <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                                <td>{{ $student['section'] ?? 'N/A' }}</td>
                                <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                                <td class="grade watchlist">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                                <td class="center">{{ $student['absences'] ?? 0 }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div class="no-students">No students currently under Recent Declines.</div>
            @endif
        @endif

        <div class="summary-section">
            <div class="summary-header-bar">Report Summary</div>
            <div class="summary-meta">
                Criteria and inclusion are based on teacher Class Settings and selected dashboard export filters.
            </div>

            <table class="summary-table">
                <thead>
                    <tr>
                        <th style="width: 14%;">Category</th>
                        <th style="width: 30%;">Configured Criteria</th>
                        <th style="width: 12%;">Class Setting</th>
                        <th style="width: 12%;">In Report</th>
                        <th style="width: 10%;">Count</th>
                        <th style="width: 22%;">Recommended Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong style="color: #991b1b;">At Risks</strong></td>
                        <td>{{ $atRiskCriteria }}</td>
                        <td class="center">
                            <span class="badge {{ $observeAtRisk ? 'enabled' : 'disabled' }}">{{ $observeAtRisk ? 'Enabled' : 'Hidden' }}</span>
                        </td>
                        <td class="center">
                            <span class="badge {{ $includeAtRisk ? 'enabled' : 'disabled' }}">{{ $includeAtRisk ? 'Included' : 'Excluded' }}</span>
                        </td>
                        <td class="center">{{ $atRiskIncludedCount }}</td>
                        <td class="priority-high">Immediate one-on-one remediation and parent conference.</td>
                    </tr>
                    <tr>
                        <td><strong style="color: #92400e;">Needs Attention</strong></td>
                        <td>{{ $needsAttentionCriteria }}</td>
                        <td class="center">
                            <span class="badge {{ $observeNeedsAttention ? 'enabled' : 'disabled' }}">{{ $observeNeedsAttention ? 'Enabled' : 'Hidden' }}</span>
                        </td>
                        <td class="center">
                            <span class="badge {{ $includeNeedsAttention ? 'enabled' : 'disabled' }}">{{ $includeNeedsAttention ? 'Included' : 'Excluded' }}</span>
                        </td>
                        <td class="center">{{ $needsAttentionIncludedCount }}</td>
                        <td class="priority-medium">Attendance intervention and family follow-up.</td>
                    </tr>
                    <tr>
                        <td><strong style="color: #1e3a8a;">Recent Declines</strong></td>
                        <td>{{ $recentDeclineCriteria }}</td>
                        <td class="center">
                            <span class="badge {{ $observeRecentDecline ? 'enabled' : 'disabled' }}">{{ $observeRecentDecline ? 'Enabled' : 'Hidden' }}</span>
                        </td>
                        <td class="center">
                            <span class="badge {{ $includeRecentDecline ? 'enabled' : 'disabled' }}">{{ $includeRecentDecline ? 'Included' : 'Excluded' }}</span>
                        </td>
                        <td class="center">{{ $recentDeclineIncludedCount }}</td>
                        <td class="priority-monitor">Close monitoring, subject consultation, and progress checks.</td>
                    </tr>
                    <tr class="summary-total-row">
                        <td class="center">Total</td>
                        <td colspan="3">Students currently included in this generated report</td>
                        <td class="center">{{ $totalIncludedCount }}</td>
                        <td>For teacher, adviser, and guidance unit action planning.</td>
                    </tr>
                </tbody>
            </table>

            <div class="recommendations">
                <div class="recommendations-title">Action Notes</div>
                <ol class="recommendations-list">
                    @if($includeAtRisk && count($atRiskStudents) > 0)
                        <li><strong>At risk students:</strong> prepare individualized remediation plans and schedule parent meetings within the week.</li>
                    @endif
                    @if($includeNeedsAttention && count($needsAttentionStudents) > 0)
                        <li><strong>Needs attention:</strong> review attendance records, verify causes, and coordinate support interventions.</li>
                    @endif
                    @if($includeRecentDecline && count($recentDeclineStudents) > 0)
                        <li><strong>Recent declines:</strong> review assessment trends and implement targeted subject coaching.</li>
                    @endif
                    @if($totalIncludedCount === 0)
                        <li>No immediate high-priority interventions are required for the selected categories.</li>
                    @endif
                    <li>Record interventions in SATIS and review progress during regular class advisories.</li>
                    <li>Elevate persistent concerns to the guidance office for multi-disciplinary action.</li>
                </ol>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated by SATIS - Smart Academic Tracking and Intervention System</p>
            <p>{{ \Illuminate\Support\Carbon::now('Asia/Manila')->format('F d, Y h:i A') }} | Confidential - For internal use only</p>
        </div>
    </body>
</html>

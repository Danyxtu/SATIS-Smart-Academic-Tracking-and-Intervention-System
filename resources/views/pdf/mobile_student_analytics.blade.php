<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Analytics Report - {{ $student['name'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1f2937;
            background: #fff;
        }
        
        .container {
            padding: 20px 30px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header Styles */
        .header {
            text-align: center;
            border-bottom: 3px solid #DB2777;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 20px;
            color: #DB2777;
            margin-bottom: 5px;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 12px;
            color: #6b7280;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: #DB2777;
            letter-spacing: -1px;
            margin-bottom: 10px;
        }
        
        /* Student Info Card */
        .student-info {
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
            border-radius: 12px;
            padding: 15px 20px;
            margin-bottom: 20px;
            border-left: 4px solid #DB2777;
        }
        
        .student-info h2 {
            font-size: 16px;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .student-info .info-grid {
            display: table;
            width: 100%;
        }
        
        .student-info .info-row {
            display: table-row;
        }
        
        .student-info .info-label {
            display: table-cell;
            color: #6b7280;
            font-size: 10px;
            padding: 3px 15px 3px 0;
            width: 100px;
        }
        
        .student-info .info-value {
            display: table-cell;
            color: #1f2937;
            font-weight: 600;
            font-size: 11px;
            padding: 3px 0;
        }
        
        /* Subject Header */
        .subject-header {
            background: #f9fafb;
            border-radius: 10px;
            padding: 15px 20px;
            margin-bottom: 20px;
            display: table;
            width: 100%;
        }
        
        .subject-header .subject-info {
            display: table-cell;
            vertical-align: middle;
            width: 60%;
        }
        
        .subject-header h3 {
            font-size: 15px;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .subject-header .teacher {
            font-size: 11px;
            color: #6b7280;
        }
        
        .subject-header .grade-box {
            display: table-cell;
            text-align: right;
            vertical-align: middle;
        }
        
        .grade-circle {
            display: inline-block;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            text-align: center;
            line-height: 70px;
            font-size: 22px;
            font-weight: 700;
            color: #fff;
        }
        
        .grade-excellent { background: linear-gradient(135deg, #10b981, #059669); }
        .grade-good { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .grade-satisfactory { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .grade-needs-improvement { background: linear-gradient(135deg, #ef4444, #dc2626); }
        
        /* Section Styles */
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #DB2777;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #fce7f3;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: #DB2777;
            margin-right: 8px;
            border-radius: 2px;
        }
        
        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        
        th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
        }
        
        td {
            padding: 8px 12px;
            border-bottom: 1px solid #f3f4f6;
            color: #4b5563;
        }
        
        tr:nth-child(even) {
            background: #fafafa;
        }
        
        tr:hover {
            background: #fdf2f8;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .stat-card {
            display: table-cell;
            width: 25%;
            text-align: center;
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .stat-card + .stat-card {
            margin-left: 10px;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
        }
        
        .stat-label {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            margin-top: 2px;
        }
        
        /* Attendance Stats */
        .attendance-grid {
            display: table;
            width: 100%;
        }
        
        .attendance-item {
            display: table-cell;
            text-align: center;
            padding: 8px;
        }
        
        .attendance-value {
            font-size: 16px;
            font-weight: 700;
        }
        
        .attendance-label {
            font-size: 9px;
            color: #6b7280;
        }
        
        .present { color: #10b981; }
        .absent { color: #ef4444; }
        .late { color: #f59e0b; }
        .excused { color: #3b82f6; }
        
        /* Risk Badge */
        .risk-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .risk-on-track { background: #d1fae5; color: #065f46; }
        .risk-needs-attention { background: #fef3c7; color: #92400e; }
        .risk-at-risk { background: #fee2e2; color: #991b1b; }
        .risk-critical { background: #fecaca; color: #7f1d1d; }
        
        /* Suggestions */
        .suggestions-list {
            list-style: none;
            padding: 0;
        }
        
        .suggestions-list li {
            padding: 8px 12px;
            background: #fdf2f8;
            border-radius: 6px;
            margin-bottom: 6px;
            font-size: 10px;
            color: #831843;
            border-left: 3px solid #DB2777;
        }
        
        .suggestions-list li::before {
            content: '💡';
            margin-right: 8px;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #f3f4f6;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
        }
        
        .footer .generated-at {
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        /* Quarterly Grades Visual */
        .quarter-cards {
            display: table;
            width: 100%;
        }
        
        .quarter-card {
            display: table-cell;
            width: 50%;
            padding: 10px;
            text-align: center;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .quarter-card h4 {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .quarter-card .q-grade {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
        }
        
        .quarter-card .q-info {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 3px;
        }
        
        .not-started {
            color: #d97706;
            font-style: italic;
            font-size: 10px;
        }
        
        /* Page break for printing */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-text">SATIS</div>
            <h1>Student Analytics Report</h1>
            <p class="subtitle">Smart Academic Tracking and Intervention System</p>
        </div>
        
        <!-- Student Information -->
        <div class="student-info">
            <h2>{{ $student['name'] }}</h2>
            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">LRN:</span>
                    <span class="info-value">{{ $student['lrn'] ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Grade Level:</span>
                    <span class="info-value">{{ $student['gradeLevel'] ?? 'N/A' }}</span>
                </div>
                @if($student['strand'] ?? null)
                <div class="info-row">
                    <span class="info-label">Strand:</span>
                    <span class="info-value">{{ $student['strand'] }}</span>
                </div>
                @endif
            </div>
        </div>
        
        <!-- Subject Header with Grade -->
        <div class="subject-header">
            <div class="subject-info">
                <h3>{{ $subject['name'] }}</h3>
                <p class="teacher">
                    {{ $subject['teacher'] }} • {{ $subject['section'] ?? '' }}
                    @if($subject['grade_level'])
                    • Grade {{ $subject['grade_level'] }}
                    @endif
                </p>
            </div>
            <div class="grade-box">
                @php
                    $gradeClass = 'grade-needs-improvement';
                    $grade = $performance['overallGrade'];
                    if ($grade !== null) {
                        if ($grade >= 90) $gradeClass = 'grade-excellent';
                        elseif ($grade >= 85) $gradeClass = 'grade-good';
                        elseif ($grade >= 75) $gradeClass = 'grade-satisfactory';
                    }
                @endphp
                <div class="grade-circle {{ $gradeClass }}">
                    {{ $performance['overallGrade'] ?? '--' }}
                </div>
            </div>
        </div>
        
        <!-- Performance Overview Section -->
        <div class="section">
            <div class="section-title">Performance Overview</div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{{ $performance['overallGrade'] ?? '--' }}%</div>
                    <div class="stat-label">Overall Grade</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ $attendance['rate'] ?? '--' }}%</div>
                    <div class="stat-label">Attendance Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ count($performance['gradeBreakdown'] ?? []) }}</div>
                    <div class="stat-label">Total Grades</div>
                </div>
                <div class="stat-card">
                    @php
                        $riskClass = 'risk-on-track';
                        $riskLabel = $risk['label'] ?? 'N/A';
                        if (str_contains(strtolower($riskLabel), 'critical')) $riskClass = 'risk-critical';
                        elseif (str_contains(strtolower($riskLabel), 'at risk')) $riskClass = 'risk-at-risk';
                        elseif (str_contains(strtolower($riskLabel), 'attention')) $riskClass = 'risk-needs-attention';
                    @endphp
                    <span class="risk-badge {{ $riskClass }}">{{ $riskLabel }}</span>
                    <div class="stat-label" style="margin-top: 5px;">Status</div>
                </div>
            </div>
        </div>
        
        <!-- Quarterly Grades Section -->
        <div class="section">
            <div class="section-title">Quarterly Performance</div>
            
            @php
                $qMap = collect($performance['quarterlyGrades'])->keyBy('quarterNum');
            @endphp
            
            <div class="quarter-cards">
                <div class="quarter-card" style="margin-right: 10px;">
                    <h4>QUARTER 1</h4>
                    <div class="q-grade">{{ $qMap->get(1)['grade'] ?? '--' }}</div>
                    <div class="q-info">
                        {{ $qMap->get(1)['assignmentCount'] ?? 0 }} assignments • 
                        {{ $qMap->get(1)['attendance'] ?? 'N/A' }} attendance
                    </div>
                </div>
                <div class="quarter-card">
                    <h4>QUARTER 2</h4>
                    @if(($subject['current_quarter'] ?? 1) < 2 && !isset($qMap->get(2)['grade']))
                        <p class="not-started">Not Started Yet</p>
                    @else
                        <div class="q-grade">{{ $qMap->get(2)['grade'] ?? '--' }}</div>
                        <div class="q-info">
                            {{ $qMap->get(2)['assignmentCount'] ?? 0 }} assignments • 
                            {{ $qMap->get(2)['attendance'] ?? 'N/A' }} attendance
                        </div>
                    @endif
                </div>
            </div>
        </div>
        
        <!-- Attendance Section -->
        <div class="section">
            <div class="section-title">Attendance Summary</div>
            
            <div class="attendance-grid">
                <div class="attendance-item">
                    <div class="attendance-value">{{ $attendance['totalDays'] ?? 0 }}</div>
                    <div class="attendance-label">Total Days</div>
                </div>
                <div class="attendance-item">
                    <div class="attendance-value present">{{ $attendance['presentDays'] ?? 0 }}</div>
                    <div class="attendance-label">Present</div>
                </div>
                <div class="attendance-item">
                    <div class="attendance-value absent">{{ $attendance['absentDays'] ?? 0 }}</div>
                    <div class="attendance-label">Absent</div>
                </div>
                <div class="attendance-item">
                    <div class="attendance-value late">{{ $attendance['lateDays'] ?? 0 }}</div>
                    <div class="attendance-label">Late</div>
                </div>
                <div class="attendance-item">
                    <div class="attendance-value excused">{{ $attendance['excusedDays'] ?? 0 }}</div>
                    <div class="attendance-label">Excused</div>
                </div>
            </div>
        </div>
        
        <!-- Grade Breakdown Section -->
        @if(count($performance['gradeBreakdown'] ?? []) > 0)
        <div class="section">
            <div class="section-title">Grade Breakdown</div>
            
            <table>
                <thead>
                    <tr>
                        <th>Assignment</th>
                        <th>Quarter</th>
                        <th>Score</th>
                        <th>Total</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($performance['gradeBreakdown'] as $grade)
                    <tr>
                        <td>{{ $grade['name'] }}</td>
                        <td>Q{{ $grade['quarter'] }}</td>
                        <td>{{ $grade['score'] }}</td>
                        <td>{{ $grade['totalScore'] }}</td>
                        <td>
                            @if($grade['percentage'] !== null)
                                <strong style="color: {{ $grade['percentage'] >= 75 ? '#10b981' : '#ef4444' }}">
                                    {{ $grade['percentage'] }}%
                                </strong>
                            @else
                                N/A
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <!-- Suggestions Section -->
        @if(count($suggestions ?? []) > 0)
        <div class="section">
            <div class="section-title">Recommendations</div>
            
            <ul class="suggestions-list">
                @foreach($suggestions as $suggestion)
                <li>{{ $suggestion }}</li>
                @endforeach
            </ul>
        </div>
        @endif
        
        <!-- Footer -->
        <div class="footer">
            <p class="generated-at">Generated on {{ $generatedAt ?? now()->format('F d, Y h:i A') }}</p>
            <p>SATIS - Smart Academic Tracking and Intervention System</p>
            <p>This report was automatically generated from SATIS Mobile App</p>
        </div>
    </div>
</body>
</html>

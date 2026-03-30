<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Priority Students Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                font-size: 11px; 
                color: #000; 
                margin: 0; 
                padding: 20px; 
            }
            .header { 
                text-align: center; 
                margin-bottom: 25px; 
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            .logo-title {
                font-size: 22px; 
                font-weight: bold; 
                margin-bottom: 5px;
                color: #1e40af;
            }
            .subtitle { 
                font-size: 14px; 
                color: #333; 
                margin-bottom: 5px; 
            }
            .report-type {
                font-size: 16px;
                font-weight: bold;
                color: #374151;
                margin-top: 10px;
            }
            .date-info {
                font-size: 11px;
                color: #6b7280;
                margin-top: 5px;
            }
            .teacher-info {
                font-size: 12px;
                color: #374151;
                margin-top: 10px;
                text-align: left;
                background: #f3f4f6;
                padding: 10px;
                border-radius: 5px;
            }
            .section-header {
                background: #e5e7eb;
                padding: 10px 15px;
                margin: 20px 0 10px 0;
                font-size: 14px;
                font-weight: bold;
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
                font-size: 12px;
                font-weight: normal;
                color: #6b7280;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px;
            }
            th, td { 
                border: 1px solid #d1d5db; 
                padding: 8px 10px; 
                text-align: left; 
            }
            th { 
                background: #f9fafb; 
                font-weight: bold; 
                font-size: 10px;
                text-transform: uppercase;
                color: #374151;
            }
            .name { 
                font-weight: 500;
            }
            .grade {
                text-align: center;
                font-weight: bold;
            }
            .grade.critical {
                color: #dc2626;
            }
            .grade.warning {
                color: #f59e0b;
            }
            .grade.watchlist {
                color: #3b82f6;
            }
            .trend {
                text-align: center;
                font-size: 10px;
            }
            .trend.declining {
                color: #dc2626;
            }
            .trend.stable {
                color: #6b7280;
            }
            .trend.improving {
                color: #059669;
            }
            .subject {
                font-size: 10px;
                color: #6b7280;
            }
            .intervention-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: bold;
            }
            .intervention-badge.tier1 {
                background: #dcfce7;
                color: #166534;
            }
            .intervention-badge.tier2 {
                background: #fef3c7;
                color: #92400e;
            }
            .intervention-badge.tier3 {
                background: #fee2e2;
                color: #991b1b;
            }
            .no-students {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-style: italic;
            }
            .summary-section {
                margin-top: 30px;
                border-top: 2px solid #e5e7eb;
                padding-top: 20px;
            }
            .summary-title {
                font-size: 16px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 15px;
            }
            .summary-grid {
                display: table;
                width: 100%;
            }
            .summary-row {
                display: table-row;
            }
            .summary-cell {
                display: table-cell;
                padding: 10px;
                text-align: center;
                border: 1px solid #e5e7eb;
            }
            .summary-cell.header {
                background: #f9fafb;
                font-weight: bold;
                font-size: 12px;
            }
            .summary-number {
                font-size: 24px;
                font-weight: bold;
                display: block;
            }
            .summary-label {
                font-size: 10px;
                color: #6b7280;
                display: block;
                margin-top: 3px;
            }
            .summary-number.critical { color: #dc2626; }
            .summary-number.warning { color: #f59e0b; }
            .summary-number.watchlist { color: #3b82f6; }
            .summary-number.total { color: #1f2937; }
            
            .recommendations {
                margin-top: 20px;
                background: #f9fafb;
                padding: 15px;
                border-radius: 5px;
            }
            .recommendations-title {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .recommendations-list {
                margin: 0;
                padding-left: 20px;
            }
            .recommendations-list li {
                margin-bottom: 5px;
                font-size: 11px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                font-size: 10px;
                color: #6b7280;
                text-align: center;
            }
            .page-break {
                page-break-before: always;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo-title">SATIS</div>
            <div class="subtitle">Smart Academic Tracking and Intervention System</div>
            <div class="report-type">Priority Students Report</div>
            <div class="date-info">Generated on {{ \Carbon\Carbon::now()->format('F d, Y \a\t h:i A') }}</div>
        </div>

        <div class="teacher-info">
            <strong>Teacher:</strong> {{ $teacher['name'] }}<br>
            @if($department)
                <strong>Department:</strong> {{ $department['name'] }}<br>
            @endif
            @if($academicPeriod)
                <strong>Academic Period:</strong> S.Y. {{ $academicPeriod['schoolYear'] }} - 
                {{ $academicPeriod['semester'] == 1 ? '1st' : '2nd' }} Semester
            @endif
        </div>

        @if($includeAtRisk && count($atRiskStudents) > 0)
            <div class="section-header critical">
                At Risks <span class="section-count">- {{ count($atRiskStudents) }} student(s)</span>
            </div>
            <p style="font-size: 10px; color: #6b7280; margin: 0 0 10px 0;">
                Students with grades below 75%
            </p>
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
                            <td>{{ $index + 1 }}</td>
                            <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                            <td>{{ $student['section'] ?? 'N/A' }}</td>
                            <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                            <td class="grade critical">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                            <td>{{ $student['absences'] ?? 0 }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @elseif($includeAtRisk)
            <div class="section-header critical">
                At Risks <span class="section-count">- 0 student(s)</span>
            </div>
            <div class="no-students">No students currently in critical status. Great job!</div>
        @endif

        @if($includeNeedsAttention && count($needsAttentionStudents) > 0)
            <div class="section-header warning">
                Needs Attention <span class="section-count">- {{ count($needsAttentionStudents) }} student(s)</span>
            </div>
            <p style="font-size: 10px; color: #6b7280; margin: 0 0 10px 0;">
                Students absent more than 5 times
            </p>
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
                            <td>{{ $index + 1 }}</td>
                            <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                            <td>{{ $student['section'] ?? 'N/A' }}</td>
                            <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                            <td class="grade warning">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                            <td>{{ $student['absences'] ?? 0 }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @elseif($includeNeedsAttention)
            <div class="section-header warning">
                Needs Attention <span class="section-count">- 0 student(s)</span>
            </div>
            <div class="no-students">No students currently need attention.</div>
        @endif

        @if($includeRecentDecline && count($recentDeclineStudents) > 0)
            <div class="section-header watchlist">
                Recent Declines <span class="section-count">- {{ count($recentDeclineStudents) }} student(s)</span>
            </div>
            <p style="font-size: 10px; color: #6b7280; margin: 0 0 10px 0;">
                Students whose grades dropped from >75 to 75 or below
            </p>
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
                            <td>{{ $index + 1 }}</td>
                            <td class="name">{{ $student['student_name'] ?? 'N/A' }}</td>
                            <td>{{ $student['section'] ?? 'N/A' }}</td>
                            <td class="subject">{{ $student['subject'] ?? 'N/A' }}</td>
                            <td class="grade watchlist">{{ $student['grade'] !== null ? $student['grade'] . '%' : 'N/A' }}</td>
                            <td>{{ $student['absences'] ?? 0 }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @elseif($includeRecentDecline)
            <div class="section-header watchlist">
                Recent Declines <span class="section-count">- 0 student(s)</span>
            </div>
            <div class="no-students">No students currently on the watchlist.</div>
        @endif

        {{-- Summary Section --}}
        <div class="summary-section">
            <div class="summary-title">Report Summary</div>
            
            <table style="margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th style="text-align: center;">Category</th>
                        <th style="text-align: center;">Student Count</th>
                        <th style="text-align: center;">Description</th>
                        <th style="text-align: center;">Recommended Action</th>
                    </tr>
                </thead>
                <tbody>
                    @if($includeAtRisk)
                    <tr>
                        <td style="text-align: center;"><strong style="color: #dc2626;">At Risks</strong></td>
                        <td style="text-align: center;"><span class="summary-number critical">{{ count($atRiskStudents) }}</span></td>
                        <td>Grade below 75%</td>
                        <td>Immediate academic intervention required</td>
                    </tr>
                    @endif
                    @if($includeNeedsAttention)
                    <tr>
                        <td style="text-align: center;"><strong style="color: #f59e0b;">Needs Attention</strong></td>
                        <td style="text-align: center;"><span class="summary-number warning">{{ count($needsAttentionStudents) }}</span></td>
                        <td>Absent more than 5 times</td>
                        <td>Attendance follow-up recommended</td>
                    </tr>
                    @endif
                    @if($includeRecentDecline)
                    <tr>
                        <td style="text-align: center;"><strong style="color: #3b82f6;">Recent Declines</strong></td>
                        <td style="text-align: center;"><span class="summary-number watchlist">{{ count($recentDeclineStudents) }}</span></td>
                        <td>Dropped from &gt;75 to 75 or below</td>
                        <td>Monitor progress closely</td>
                    </tr>
                    @endif
                    <tr style="background: #f3f4f6;">
                        <td style="text-align: center;"><strong>Total</strong></td>
                        <td style="text-align: center;">
                            <span class="summary-number total">
                                {{ ($includeAtRisk ? count($atRiskStudents) : 0) + ($includeNeedsAttention ? count($needsAttentionStudents) : 0) + ($includeRecentDecline ? count($recentDeclineStudents) : 0) }}
                            </span>
                        </td>
                        <td colspan="2">Students requiring attention</td>
                    </tr>
                </tbody>
            </table>

            <div class="recommendations">
                <div class="recommendations-title">General Recommendations</div>
                <ul class="recommendations-list">
                    @if($includeAtRisk && count($atRiskStudents) > 0)
                        <li><strong>At risk students:</strong> Schedule immediate one-on-one meetings and create support plans.</li>
                    @endif
                    @if($includeNeedsAttention && count($needsAttentionStudents) > 0)
                        <li><strong>Needs attention students:</strong> Review attendance concerns and coordinate with guardians.</li>
                    @endif
                    @if($includeRecentDecline && count($recentDeclineStudents) > 0)
                        <li><strong>Recent declines:</strong> Investigate sudden drops and provide targeted remediation support.</li>
                    @endif
                    <li>Document all interventions and track progress regularly.</li>
                    <li>Communicate with parents/guardians about student performance concerns.</li>
                    <li>Collaborate with guidance counselors for students with persistent issues.</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated by SATIS - Smart Academic Tracking and Intervention System</p>
            <p>{{ \Carbon\Carbon::now()->format('F d, Y h:i A') }} | Confidential - For internal use only</p>
        </div>
    </body>
</html>

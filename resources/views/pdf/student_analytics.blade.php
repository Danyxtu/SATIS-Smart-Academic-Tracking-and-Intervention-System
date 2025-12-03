<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Analytics - {{ $student['name'] }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
        h1 { margin: 0; font-size: 18px; }
        h2 { margin: 0 0 8px 0; font-size: 13px; color: #666; }
        .section { margin-top: 10px; }
        .meta { font-size: 12px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
        th { background: #f7fafc; font-weight: 700; }
        .q-not-started { color: #b45309; font-weight: 700; }
    </style>
</head>
<body>
    <h1>{{ $student['name'] }}</h1>
    <h2>{{ $subject['grade_level'] }} - {{ $subject['section'] }} | {{ $subject['name'] }}</h2>
    <div class="meta">Generated: {{ now()->format('Y-m-d') }}</div>

    <div class="section">
        <h3>Overall Performance</h3>
        <table>
            <tr><th>Overall Grade</th><td>{{ $performance['overallGrade'] ?? 'N/A' }}</td></tr>
            <tr><th>Attendance Rate</th><td>{{ $attendance['rate'] ?? 'N/A' }}%</td></tr>
            <tr><th>Prediction</th><td>{{ $prediction['final_prediction'] ?? ($prediction['predicted_grade'] ?? 'N/A') }}</td></tr>
            <tr><th>Risk</th><td>{{ $risk['label'] ?? 'N/A' }}</td></tr>
        </table>
    </div>

    <div class="section">
        <h3>Quarterly Grades</h3>
        <table>
            <thead>
                <tr>
                    <th>Quarter</th>
                    <th>Grade</th>
                    <th>Attendance</th>
                    <th>Assignments</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $qMap = collect($performance['quarterlyGrades'])->keyBy('quarterNum');
                @endphp

                <tr>
                    <td>Q1</td>
                    <td>{{ $qMap->get(1)['grade'] ?? 'N/A' }}</td>
                    <td>{{ $qMap->get(1)['attendance'] ?? 'N/A' }}</td>
                    <td>{{ $qMap->get(1)['assignmentCount'] ?? 0 }}</td>
                </tr>
                <tr>
                    <td>Q2</td>
                    <td>
                        @if(($subject['current_quarter'] ?? 1) < 2 && !isset($qMap->get(2)['grade']))
                            <span class="q-not-started">Q2 has not been started yet</span>
                        @else
                            {{ $qMap->get(2)['grade'] ?? 'N/A' }}
                        @endif
                    </td>
                    <td>{{ $qMap->get(2)['attendance'] ?? 'N/A' }}</td>
                    <td>{{ $qMap->get(2)['assignmentCount'] ?? 0 }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Grade Breakdown</h3>
        <table>
            <thead>
                <tr>
                    <th>Assignment</th>
                    <th>Quarter</th>
                    <th>Score</th>
                    <th>Total</th>
                    <th>Percent</th>
                </tr>
            </thead>
            <tbody>
                @foreach($performance['gradeBreakdown'] as $g)
                <tr>
                    <td>{{ $g['name'] }}</td>
                    <td>Q{{ $g['quarter'] }}</td>
                    <td>{{ $g['score'] }}</td>
                    <td>{{ $g['totalScore'] }}</td>
                    <td>{{ $g['percentage'] ?? 'N/A' }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Intervention & Suggestions</h3>
        <table>
            <tr>
                <th>Risk</th>
                <td>{{ $risk['label'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Suggestions</th>
                <td>
                    @if(is_array($suggestions))
                        <ul>
                            @foreach($suggestions as $s)
                                <li>{{ $s }}</li>
                            @endforeach
                        </ul>
                    @else
                        {{ $suggestions ?? 'N/A' }}
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>
</html>

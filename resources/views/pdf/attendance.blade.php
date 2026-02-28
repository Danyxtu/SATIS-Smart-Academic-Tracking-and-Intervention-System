
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Attendance Report</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #333; margin-bottom: 5px; }
            .month-year { font-size: 16px; font-weight: bold; color: #000; margin-top: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: center; }
            th { background: #e0e0e0; font-weight: bold; font-size: 11px; }
            .name { text-align: left; }
            .lrn { font-size: 10px; }
            .present { color: #166534; font-weight: bold; }
            .absent { color: #dc2626; font-weight: bold; }
            .late { color: #d97706; font-weight: bold; }
            .rate { font-weight: bold; }
            .summary { margin-top: 20px; font-size: 11px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">Monthly Attendance Report</div>
            <div class="subtitle">{{ $section['grade_level'] }} - {{ $section['section'] }} | {{ $section['subject_name'] ?? $section['label'] ?? 'N/A' }}</div>
            <div class="month-year">{{ \Carbon\Carbon::now()->format('F Y') }}</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 30%;">Student Name</th>
                    <th style="width: 15%;">LRN</th>
                    <th style="width: 10%;">Present</th>
                    <th style="width: 10%;">Absent</th>
                    <th style="width: 10%;">Late</th>
                    <th style="width: 10%;">Total Days</th>
                    <th style="width: 15%;">Attendance Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($students as $student)
                    <tr>
                        <td class="name">{{ $student['name'] }}</td>
                        <td class="lrn">{{ $student['lrn'] ?? '-' }}</td>
                        <td class="present">{{ $student['stats']['present'] }}</td>
                        <td class="absent">{{ $student['stats']['absent'] }}</td>
                        <td class="late">{{ $student['stats']['late'] }}</td>
                        <td>{{ $student['stats']['total'] }}</td>
                        <td class="rate">{{ $student['stats']['rate'] }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <strong>Report Generated:</strong> {{ \Carbon\Carbon::now()->format('F d, Y h:i A') }}
        </div>
    </body>
</html>

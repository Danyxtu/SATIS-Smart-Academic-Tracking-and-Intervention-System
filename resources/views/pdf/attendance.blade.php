<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Attendance Report - {{ $section['label'] }}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
            h1 { margin: 0; font-size: 18px; }
            h2 { margin: 0 0 10px 0; font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: center; }
            th { background: #f7fafc; font-weight: 700; }
            .name { text-align: left; }
            .legend { margin-top: 10px; font-size: 11px; }
            .legend span { margin-right: 12px; }
        </style>
    </head>
    <body>
        <h1>{{ $section['grade_level'] }} - {{ $section['section'] }}</h1>
        <h2>{{ $section['name'] }} | Generated: {{ now()->format('Y-m-d') }}</h2>

        <table>
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>LRN</th>
                    @foreach ($dates as $d)
                        <th>{{ 
                            
                            
                            \Carbon\Carbon::parse($d)->format('M d')
                        }}</th>
                    @endforeach
                    <th>P</th>
                    <th>A</th>
                    <th>L</th>
                    <th>Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($students as $student)
                    <tr>
                        <td class="name">{{ $student['name'] }}</td>
                        <td>{{ $student['lrn'] ?? '-' }}</td>
                        @foreach ($dates as $d)
                            @php
                                $status = $student['attendance'][$d] ?? null;
                                $symbol = $status === 'present' ? 'P' : ($status === 'absent' ? 'A' : ($status === 'late' ? 'L' : ($status === 'excused' ? 'E' : '-')));
                            @endphp
                            <td>{{ $symbol }}</td>
                        @endforeach
                        <td>{{ $student['stats']['present'] }}</td>
                        <td>{{ $student['stats']['absent'] }}</td>
                        <td>{{ $student['stats']['late'] }}</td>
                        <td>{{ $student['stats']['rate'] }}%</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="legend">
            <strong>Legend:</strong>
            <span>P = Present</span>
            <span>A = Absent</span>
            <span>L = Late</span>
            <span>E = Excused</span>
        </div>
    </body>
</html>

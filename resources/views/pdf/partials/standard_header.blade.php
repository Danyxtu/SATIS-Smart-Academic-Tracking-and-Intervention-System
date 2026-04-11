@php
    $systemLogoPath = resource_path('assets/satis-logo.jpg');
    $schoolLogoPath = resource_path('assets/school-logo.jpg');

    $systemLogoData = file_exists($systemLogoPath)
        ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($systemLogoPath))
        : null;

    $schoolLogoData = file_exists($schoolLogoPath)
        ? 'data:image/jpeg;base64,' . base64_encode(file_get_contents($schoolLogoPath))
        : null;
@endphp

<div style="width: 100%; margin-bottom: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: left;">
    <div style="float: left; width: 78%;">
        <div style="display: table;">
            <div style="display: table-cell; vertical-align: middle;">
                @if($systemLogoData)
                    <img src="{{ $systemLogoData }}" alt="SATIS Logo" style="width: 44px; height: 44px; object-fit: contain; border-radius: 50%;">
                @else
                    <div style="width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 50%; background: #e5e7eb; color: #111827; font-size: 11px; font-weight: 700;">
                        SATIS
                    </div>
                @endif
            </div>

            <div style="display: table-cell; vertical-align: middle; padding-left: 10px;">
                <div style="font-size: 20px; font-weight: 800; line-height: 1.05;">
                    <span style="color: #111827;">SATIS</span><span style="color: #5b21b6;">-FACTION</span>
                </div>
                <div style="font-size: 10px; letter-spacing: 0.8px; color: #475569; font-weight: 600;">
                    Smart Academic Tracking and Intervention System
                </div>
            </div>
        </div>
    </div>

    <div style="float: right; width: 20%; text-align: right;">
        @if($schoolLogoData)
            <img src="{{ $schoolLogoData }}" alt="School Logo" style="width: 52px; height: 52px; object-fit: contain;">
        @else
            <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; text-align: center; border: 1px solid #d1d5db; border-radius: 6px; color: #6b7280; font-size: 8px;">
                School Logo
            </div>
        @endif
    </div>

    <div style="clear: both;"></div>
</div>
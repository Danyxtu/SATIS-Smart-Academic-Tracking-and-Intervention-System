<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your SATIS OTP Code</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf2f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fdf2f8;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f9a8d4;">
                    <tr>
                        <td style="padding:24px;background:linear-gradient(135deg,#be185d 0%,#ec4899 100%);">
                            <h1 style="margin:0;font-size:22px;line-height:1.2;font-weight:800;color:#ffffff;">SATIS OTP Verification</h1>
                            <p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:#fce7f3;">
                                Smart Academic Tracking and Intervention System
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;">
                                Use this 6-digit OTP code to verify your personal email:
                            </p>

                            <div style="margin:14px 0 16px 0;padding:14px 16px;border-radius:12px;background-color:#fdf2f8;border:1px solid #fbcfe8;text-align:center;">
                                <span style="display:inline-block;font-size:32px;line-height:1.1;font-weight:800;letter-spacing:8px;color:#be185d;">{{ $otp }}</span>
                            </div>

                            <p style="margin:0;font-size:14px;line-height:1.7;">
                                This code expires in <strong>{{ $expiresInMinutes ?? 6 }} minutes</strong>.
                            </p>

                            <p style="margin:14px 0 0 0;font-size:13px;line-height:1.7;color:#4b5563;">
                                If you did not request this OTP, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Login Credentials</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf2f8;font-family:Arial,Helvetica,sans-serif;color:#000000;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fdf2f8;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #fbcfe8;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#581c87 0%,#be185d 55%,#ec4899 100%);padding:22px 24px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="width:64px;vertical-align:middle;">
                                        <img src="{{ $logoUrl }}" alt="SATIS Logo" width="52" height="52" style="display:block;border-radius:999px;background:#ffffff;padding:4px;" />
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <div style="font-size:22px;line-height:1.2;font-weight:800;color:#f8fafc;letter-spacing:0.2px;">
                                            SATIS<span style="color:#fbcfe8;">-FACTION</span>
                                        </div>
                                        <div style="margin-top:4px;font-size:11px;line-height:1.4;text-transform:uppercase;letter-spacing:1px;color:#fce7f3;">
                                            Smart Academic Tracking and Intervention System
                                        </div>
                                    </td>
                                    <td align="right" style="vertical-align:top;">
                                        <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#ffffff24;border:1px solid #fbcfe866;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#fdf2f8;">
                                            {{ $portalLabel }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 10px 24px;">
                            <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;color:#000000;">Your Teacher Account Is Ready</h1>
                            <p style="margin:14px 0 0 0;font-size:15px;line-height:1.7;color:#000000;">
                                Hello <strong>{{ $userName }}</strong>,
                            </p>
                            <p style="margin:10px 0 0 0;font-size:15px;line-height:1.7;color:#000000;">
                                Your teacher account was created by <strong>{{ $issuedByName }}</strong>. Use the login credentials below to sign in.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:10px 24px 6px 24px;">
                            <div style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:12px;padding:12px 14px;">
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#000000;">
                                    <strong>Login using email:</strong> {{ $email }}
                                </p>
                                <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#000000;">
                                    <strong>Username:</strong> {{ $username }}
                                </p>
                                <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#000000;">
                                    <strong>Password:</strong> {{ $password }}
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:18px 24px 8px 24px;" align="center">
                            <a href="{{ $loginUrl }}" style="display:inline-block;padding:13px 24px;border-radius:10px;background:#db2777;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.2px;">
                                Login to SATIS
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:10px 24px 6px 24px;">
                            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;">
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#000000;">
                                    <strong>Next steps after login:</strong>
                                </p>
                                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.7;color:#000000;">
                                    1. You will be asked to create a new password immediately.<br>
                                    2. Verify your email address when prompted.<br>
                                    3. After verification, you can access the teacher portal.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:12px 24px 24px 24px;">
                            <p style="margin:0;font-size:12px;line-height:1.7;color:#000000;">
                                If you did not expect this account, contact your school administrator immediately.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #fbcfe8;background:#fdf2f8;padding:14px 24px;">
                            <p style="margin:0;font-size:11px;line-height:1.6;color:#000000;">
                                This is an automated message from SATIS-FACTION. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

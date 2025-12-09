<x-mail::message>
# Welcome to SATIS, {{ $adminName }}!

Your administrator account has been created by **{{ $createdByName }}**.

## Your Login Credentials

<x-mail::panel>
**Email:** {{ $email }}

**Temporary Password:** {{ $password }}

**Department:** {{ $departmentName }}
</x-mail::panel>

<x-mail::button :url="$loginUrl">
Login to Your Account
</x-mail::button>

## Important Security Notice

⚠️ **You will be required to change your password upon first login.**

For your security, please:
- Change your password immediately after logging in
- Do not share your credentials with anyone
- Use a strong, unique password

If you did not expect this account or have any questions, please contact your system administrator.

Thanks,<br>
{{ config('app.name') }}

<x-mail::subcopy>
This is an automated message from SATIS (Smart Academic Tracking and Intervention System). Please do not reply to this email.
</x-mail::subcopy>
</x-mail::message>

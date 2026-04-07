<x-mail::message>
# Hello, {{ $userName }}

Temporary SATIS credentials have been issued for your {{ $context }} by **{{ $issuedByName }}**.

<x-mail::panel>
**Email:** {{ $email }}

**Temporary Password:** {{ $password }}
</x-mail::panel>

<x-mail::button :url="$loginUrl">
Login to SATIS
</x-mail::button>

After you sign in, you will be required to set a new password.

For security:
- Change your password immediately after logging in.
- Do not share your credentials.
- Use a strong, unique password.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>

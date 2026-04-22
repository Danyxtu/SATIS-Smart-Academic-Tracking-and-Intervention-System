<x-mail::message>
# Credential Distribution Report

The process of distributing credentials for **{{ $className }}** has completed.

<x-mail::panel>
**Summary:**
- Successfully Sent: **{{ $successfulCount }}**
- Failed (Missing Email): **{{ $failedCount }}**
</x-mail::panel>

@if(count($failedStudents) > 0)
## Students with Missing Emails
The following students did not receive their credentials because they do not have a registered personal email address:

@foreach($failedStudents as $student)
- {{ $student['name'] }} (LRN: {{ $student['lrn'] }})
@endforeach

Please update their email addresses in the student management section and try again.
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>

<x-mail::message>
# Hello, {{ $studentName }}!

@if($notificationType === 'nudge')
Your teacher, **{{ $teacherName }}**, has sent you a friendly reminder about your academic progress in **{{ $subjectName }}**.

This is a gentle nudge to help you stay on track with your learning goals. Remember, consistent effort leads to great results!

@if($notes)
**Message from your teacher:**
> {{ $notes }}
@endif

@elseif($notificationType === 'task')
Your teacher, **{{ $teacherName }}**, has assigned you new goals to complete for **{{ $subjectName }}**.

**Your assigned tasks:**
@foreach($tasks as $task)
- ☐ {{ $task }}
@endforeach

@if($notes)
**Additional notes:**
> {{ $notes }}
@endif

Please log in to your student dashboard to view and complete these tasks.

@elseif($notificationType === 'extension')
Great news! Your teacher, **{{ $teacherName }}**, has granted you a deadline extension for **{{ $subjectName }}**.

@if($notes)
**Details:**
> {{ $notes }}
@endif

Please use this extra time wisely to complete your work.

@elseif($notificationType === 'agreement')
An academic agreement has been recorded for you in **{{ $subjectName }}** by **{{ $teacherName }}**.

This agreement is a commitment to improve your academic performance. Please make sure to fulfill the terms you agreed to.

@if($notes)
**Agreement details:**
> {{ $notes }}
@endif

@elseif($notificationType === 'meeting')
A one-on-one intervention meeting has been scheduled/logged for you by **{{ $teacherName }}** regarding **{{ $subjectName }}**.

@if($notes)
**Meeting notes:**
> {{ $notes }}
@endif

If you haven't already met with your teacher, please arrange a time to discuss your academic progress.

@else
You have received a notification from **{{ $teacherName }}** regarding **{{ $subjectName }}**.

@if($notes)
**Message:**
> {{ $notes }}
@endif
@endif

@if($deadlineAt)
**Compliance deadline:** {{ $deadlineAt }}

Please make sure you complete the intervention requirements before this date and time.
@endif

<x-mail::button :url="config('app.url')">
View Your Dashboard
</x-mail::button>

If you have any questions, please don't hesitate to reach out to your teacher.

Best regards,<br>
**SATIS** - Smart Academic Tracking and Intervention System
</x-mail::message>

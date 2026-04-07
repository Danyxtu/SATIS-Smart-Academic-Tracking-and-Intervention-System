<?php

namespace App\Mail;

use App\Models\Intervention;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterventionNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $studentName;
    public string $teacherName;
    public string $subjectName;
    public string $interventionType;
    public string $interventionLabel;
    public ?string $notes;
    public ?string $deadlineAt;
    public array $tasks;
    public string $notificationType;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Intervention $intervention,
        public User $student,
        public User $teacher,
        string $subjectName,
        string $notificationType = 'nudge'
    ) {
        $this->studentName = $student->name ?? 'Student';
        $this->teacherName = $teacher->name ?? 'Your Teacher';
        $this->subjectName = $subjectName;
        $this->interventionType = $intervention->type;
        $this->interventionLabel = Intervention::getTypes()[$intervention->type] ?? $intervention->type;
        $this->notes = $intervention->notes;
        $this->deadlineAt = $intervention->deadline_at?->format('M d, Y h:i A');
        $this->tasks = $intervention->tasks->pluck('description')->toArray();
        $this->notificationType = $notificationType;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjects = [
            'nudge' => '📚 Academic Reminder from ' . $this->teacherName,
            'task' => '📋 New Goals Assigned - ' . $this->subjectName,
            'extension' => '⏰ Deadline Extension Granted - ' . $this->subjectName,
            'agreement' => '📄 Academic Agreement Recorded - ' . $this->subjectName,
            'meeting' => '💬 Intervention Meeting Scheduled - ' . $this->subjectName,
            'general' => '📢 Important Notice from ' . $this->teacherName,
        ];

        return new Envelope(
            subject: $subjects[$this->notificationType] ?? $subjects['general'],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.intervention-notification',
            with: [
                'studentName' => $this->studentName,
                'teacherName' => $this->teacherName,
                'subjectName' => $this->subjectName,
                'interventionType' => $this->interventionType,
                'interventionLabel' => $this->interventionLabel,
                'notes' => $this->notes,
                'deadlineAt' => $this->deadlineAt,
                'tasks' => $this->tasks,
                'notificationType' => $this->notificationType,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeacherCredentials extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $teacher,
        public string $plainPassword,
        public ?User $issuedBy = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your SATIS Teacher Login Credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.TeacherCredentialsMailTemplate',
            with: [
                'userName' => $this->teacher->name,
                'email' => (string) $this->teacher->email,
                'username' => (string) $this->teacher->username,
                'password' => $this->plainPassword,
                'issuedByName' => $this->issuedBy?->name ?? 'System Administrator',
                'loginUrl' => config('app.url') . '/login',
                'portalLabel' => 'Teacher Portal',
                'logoUrl' => url('/images/satis-logo.png'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

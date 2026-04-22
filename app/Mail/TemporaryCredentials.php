<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemporaryCredentials extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plainPassword,
        public ?User $issuedBy = null,
        public string $context = 'account',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your SATIS Temporary Login Credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.temporary-credentials',
            with: [
                'userName' => $this->user->name,
                'username' => $this->user->username,
                'email' => $this->user->email,
                'password' => $this->plainPassword,
                'issuedByName' => $this->issuedBy?->name ?? 'System Administrator',
                'context' => $this->context,
                'loginUrl' => config('app.url') . '/login',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

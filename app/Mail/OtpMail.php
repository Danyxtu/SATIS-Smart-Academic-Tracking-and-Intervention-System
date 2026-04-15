<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public int $expiresInMinutes;

    public function __construct(string $otp, int $expiresInMinutes = 6)
    {
        $this->otp = $otp;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    public function build()
    {
        return $this->subject('Your Verification Code')
            ->view('emails.otp')
            ->with([
                'otp' => $this->otp,
                'expiresInMinutes' => $this->expiresInMinutes,
            ]);
    }
}

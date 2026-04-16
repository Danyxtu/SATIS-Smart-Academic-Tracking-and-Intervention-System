<?php

namespace App\Services\Messaging;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioSmsService
{
    public function isEnabled(): bool
    {
        return (bool) config('services.twilio.sms_enabled', false);
    }

    public function isConfigured(): bool
    {
        $sid = (string) config('services.twilio.account_sid', '');
        $token = (string) config('services.twilio.auth_token', '');
        $from = (string) config('services.twilio.from', '');
        $messagingServiceSid = (string) config('services.twilio.messaging_service_sid', '');

        if ($sid === '' || $token === '') {
            return false;
        }

        return $from !== '' || $messagingServiceSid !== '';
    }

    public function send(string $to, string $body): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        if (! $this->isConfigured()) {
            Log::warning('Twilio SMS skipped because service is not fully configured.');

            return false;
        }

        $sid = (string) config('services.twilio.account_sid');
        $token = (string) config('services.twilio.auth_token');
        $from = (string) config('services.twilio.from');
        $messagingServiceSid = (string) config('services.twilio.messaging_service_sid');

        $payload = [
            'To' => $to,
            'Body' => $body,
        ];

        if ($messagingServiceSid !== '') {
            $payload['MessagingServiceSid'] = $messagingServiceSid;
        } else {
            $payload['From'] = $from;
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($sid, $token)
                ->post(
                    "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json",
                    $payload,
                );

            if ($response->successful()) {
                return true;
            }

            Log::warning('Twilio SMS request failed.', [
                'status' => $response->status(),
                'response' => $response->json(),
                'to' => $to,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Twilio SMS exception: ' . $exception->getMessage(), [
                'to' => $to,
            ]);
        }

        return false;
    }
}

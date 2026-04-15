<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use Tests\TestCase;

class EmailOtpVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_otp_and_verify_successfully()
    {
        Mail::fake();
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);
        $email = $user->personal_email;

        $response = $this->postJson('/email-otp/send', ['email' => $email]);
        $response->assertStatus(200);
        Mail::assertSent(OtpMail::class);

        $otp = \App\Models\EmailVerificationOtp::where('user_id', $user->id)->first()->otp;
        $verify = $this->postJson('/email-otp/verify', ['email' => $email, 'otp' => $otp]);
        $verify->assertStatus(200);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame($email, $user->fresh()->personal_email);
    }

    public function test_cannot_resend_otp_within_cooldown()
    {
        Mail::fake();
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);
        $email = $user->personal_email;
        $this->postJson('/email-otp/send', ['email' => $email]);
        $response = $this->postJson('/email-otp/send', ['email' => $email]);
        $response->assertStatus(429);
    }

    public function test_otp_expires_after_6_minutes()
    {
        Mail::fake();
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);
        $email = $user->personal_email;
        $this->postJson('/email-otp/send', ['email' => $email]);
        $otp = \App\Models\EmailVerificationOtp::where('user_id', $user->id)->first();
        $otp->expires_at = now()->subMinute();
        $otp->save();
        $response = $this->postJson('/email-otp/verify', ['email' => $email, 'otp' => $otp->otp]);
        $response->assertStatus(422);
    }
}

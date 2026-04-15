<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailVerificationOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'otp',
        'expires_at',
        'resend_available_at',
    ];

    protected $dates = [
        'expires_at',
        'resend_available_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

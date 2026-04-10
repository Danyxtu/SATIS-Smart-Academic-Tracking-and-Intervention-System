<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'logged_at',
        'user_id',
        'user_name',
        'user_role',
        'school_year',
        'module',
        'task',
        'action',
        'target_type',
        'target_id',
        'route_name',
        'method',
        'path',
        'status_code',
        'is_success',
        'ip_address',
        'user_agent',
        'query_params',
        'request_payload',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'logged_at' => 'datetime',
            'query_params' => 'array',
            'request_payload' => 'array',
            'metadata' => 'array',
            'is_success' => 'boolean',
        ];
    }

    /**
     * Get the user who performed the logged action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

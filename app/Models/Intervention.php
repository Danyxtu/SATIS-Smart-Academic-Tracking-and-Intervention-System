<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Intervention extends Model
{
    protected $fillable = [
        'enrollment_id',
        'type',
        'status',
        'notes',
        'completion_requested_at',
        'completion_request_notes',
        'approved_at',
        'approved_by',
        'approval_notes',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'completion_requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function tasks()
    {
        return $this->hasMany(InterventionTask::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Optional: Helper to get readable names
    public static function getTypes()
    {
        return [
            'automated_nudge' => 'Tier 1: Reminder Nudge',
            'task_list' => 'Tier 2: Goal Checklist',
            'extension_grant' => 'Tier 2: Deadline Extension',
            'parent_contact' => 'Tier 2: Parent Contact',
            'academic_agreement' => 'Tier 3: Academic Agreement',
            'one_on_one_meeting' => 'Tier 3: One-on-One Meeting',
        ];
    }

    // Check if this is a Tier 3 intervention
    public function isTier3(): bool
    {
        return in_array($this->type, ['academic_agreement', 'one_on_one_meeting', 'counselor_referral']);
    }

    // Check if completion has been requested
    public function hasCompletionRequest(): bool
    {
        return $this->completion_requested_at !== null;
    }

    // Check if the completion request is pending (not yet approved or rejected)
    public function isPendingApproval(): bool
    {
        return $this->hasCompletionRequest()
            && $this->approved_at === null
            && $this->rejected_at === null;
    }

    // Check if student can request completion
    public function canRequestCompletion(): bool
    {
        return $this->status === 'active'
            && $this->isTier3()
            && !$this->hasCompletionRequest();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterventionTask extends Model
{
    protected $fillable = [
        'intervention_id',
        'task_name',
        'description',
        'delivery_mode',
        'is_completed',
        'completed_at',
        'approved_by_teacher_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'approved_by_teacher_at' => 'datetime',
    ];

    public function intervention()
    {
        return $this->belongsTo(Intervention::class);
    }
}

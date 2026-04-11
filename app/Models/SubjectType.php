<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SubjectType extends Model
{
    use HasFactory;

    public const CORE = 'core';
    public const APPLIED = 'applied';
    public const SPECIALIZED_ACADEMIC = 'specialized_academic';
    public const SPECIALIZED_TVL = 'specialized_tvl';

    protected $fillable = [
        'type_key',
        'name',
        'specialization_track',
    ];

    /**
     * @return array<int, string>
     */
    public static function priorityOrder(): array
    {
        return [
            self::SPECIALIZED_ACADEMIC,
            self::SPECIALIZED_TVL,
            self::CORE,
            self::APPLIED,
        ];
    }

    /**
     * @return array<int, array{type_key: string, name: string, specialization_track: ?string}>
     */
    public static function defaultTypeDefinitions(): array
    {
        return [
            [
                'type_key' => self::CORE,
                'name' => 'Core Subjects',
                'specialization_track' => null,
            ],
            [
                'type_key' => self::APPLIED,
                'name' => 'Applied Subjects',
                'specialization_track' => null,
            ],
            [
                'type_key' => self::SPECIALIZED_ACADEMIC,
                'name' => 'Academic Track Specialized Subjects',
                'specialization_track' => 'academic',
            ],
            [
                'type_key' => self::SPECIALIZED_TVL,
                'name' => 'TVL Track Specialized Subjects',
                'specialization_track' => 'tvl',
            ],
        ];
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class)->withTimestamps();
    }
}

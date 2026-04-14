<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolPersonnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'position',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone_number',
    ];
}

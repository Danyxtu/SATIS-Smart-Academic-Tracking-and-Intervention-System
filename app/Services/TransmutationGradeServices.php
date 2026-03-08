<?php

namespace App\Services;

class TransmutationGradeServices
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //  
    }

    public function transmuteGrade(float $grade): int
    {
        return match (true) {
            $grade === 100 => 100,
            $grade >= 98.40 => 99,
            $grade >= 96.80 => 98,
            $grade >= 95.20 => 97,
            $grade >= 93.60 => 96,
            $grade >= 92.00 => 95,
            $grade >= 90.40 => 94,
            $grade >= 88.80 => 93,
            $grade >= 87.20 => 92,
            $grade >= 85.60 => 91,
            $grade >= 84.00 => 90,
            $grade >= 82.40 => 89,
            $grade >= 80.80 => 88,
            $grade >= 79.20 => 87,
            $grade >= 77.60 => 86,
            $grade >= 76.00 => 85,
            $grade >= 74.40 => 84,
            $grade >= 72.80 => 83,
            $grade >= 71.20 => 82,
            $grade >= 69.60 => 81,
            $grade >= 68.00 => 80,
            $grade >= 66.40 => 79,
            $grade >= 64.80 => 78,
            $grade >= 63.20 => 77,
            $grade >= 61.60 => 76,
            $grade >= 60.00 => 75,
            $grade >= 56.00 => 74,
            $grade >= 52.00 => 73,
            $grade >= 48.00 => 72,
            $grade >= 44.00 => 71,
            $grade >= 40.00 => 70,
            $grade >= 36.00 => 69,
            $grade >= 32.00 => 68,
            $grade >= 28.00 => 67,
            $grade >= 24.00 => 66,
            $grade >= 20.00 => 65,
            $grade >= 16.00 => 64,
            $grade >= 12.00 => 63,
            $grade >= 8.00 => 62,
            $grade >= 4.00 => 61,
            default => 60,
        };
    }
}
// Just testing mwheheh

$gradeTransmute = new TransmutationGradeServices;

echo $gradeTransmute->transmuteGrade(5);

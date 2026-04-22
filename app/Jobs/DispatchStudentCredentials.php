<?php

namespace App\Jobs;

use App\Mail\CredentialDispatchReport;
use App\Mail\TemporaryCredentials;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class DispatchStudentCredentials implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public SchoolClass $schoolClass,
        public User $teacher
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->schoolClass->load(['enrollments.user.student', 'sectionRecord']);

        $successfulCount = 0;
        $failedCount = 0;
        $failedStudents = [];

        foreach ($this->schoolClass->enrollments as $enrollment) {
            $user = $enrollment->user;
            
            if (!$user) {
                continue;
            }

            // Student profile might be missing or linked to User
            $student = $user->student;
            $studentName = $student ? $student->student_name : $user->name;
            $lrn = $student ? $student->lrn : 'N/A';

            if (empty($user->email)) {
                $failedCount++;
                $failedStudents[] = [
                    'name' => $studentName,
                    'lrn' => $lrn,
                ];
                continue;
            }

            $plainPassword = Str::random(8);

            $user->update([
                'password' => $plainPassword, // User model has hashed cast
                'must_change_password' => true,
            ]);

            Mail::to($user->email)->send(new TemporaryCredentials(
                user: $user,
                plainPassword: $plainPassword,
                issuedBy: $this->teacher,
                context: 'student_account'
            ));

            $successfulCount++;
        }

        // Send report to teacher
        $className = $this->schoolClass->sectionRecord->name ?? $this->schoolClass->section ?? "Class #{$this->schoolClass->id}";
        
        Mail::to($this->teacher->email)->send(new CredentialDispatchReport(
            successfulCount: $successfulCount,
            failedCount: $failedCount,
            failedStudents: $failedStudents,
            className: $className
        ));
    }
}

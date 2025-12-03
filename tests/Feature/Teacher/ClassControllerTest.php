<?php

use App\Models\User;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
// Use $this->actingAs() within pest test closures

test('teacher can add a student and receives the generated password in session', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $subject = Subject::factory()->create(["user_id" => $teacher->id]);

    $response = $this
        ->actingAs($teacher)
        ->post(route('teacher.classes.students.store', $subject->id), [
            'name' => 'Test Student',
            'lrn' => '111222333444',
        ]);

    $response->assertSessionHas('new_student_password');

    $sessionData = session('new_student_password');
    $this->assertNotNull($sessionData['password']);

    $studentRecord = Student::where('lrn', '111222333444')->first();
    $user = User::find($studentRecord->user_id ?? null);
    $this->assertNotNull($user);
    $this->assertTrue(Hash::check($sessionData['password'], $user->password));
});

test('teacher can upload a classlist and import summary contains generated passwords for newly-created users', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $subject = Subject::factory()->create(["user_id" => $teacher->id]);

    $csv = "Student Name,LRN\nNew Student,123456789012\nAnother Student,987654321098\n";
    $file = UploadedFile::fake()->createWithContent('classlist.csv', $csv);

    $response = $this
        ->actingAs($teacher)
        ->post(route('teacher.classes.classlist.store', $subject->id), [
            'classlist' => $file,
        ]);

    $response->assertSessionHas('import_summary');

    $summary = session('import_summary');
    $this->assertIsArray($summary['created_students']);
    foreach ($summary['created_students'] as $student) {
        $this->assertArrayHasKey('password', $student);
        $this->assertNotNull($student['password']);
        $user = User::where('email', $student['email'] ?? null)->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check($student['password'], $user->password));
    }
});

test('teacher can start quarter 2 for a class', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $subject = Subject::factory()->create(['user_id' => $teacher->id, 'current_quarter' => 1]);

    $response = $this
        ->actingAs($teacher)
        ->post(route('teacher.classes.quarter.start', $subject->id), [
            'quarter' => 2,
        ]);

    $response->assertSessionHas('success');
    $this->assertEquals(2, $subject->fresh()->current_quarter);
});

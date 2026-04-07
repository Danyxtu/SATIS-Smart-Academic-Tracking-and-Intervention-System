<?php

use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

test('teacher can add a student and receives the generated password in session', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
    ]);

    actingAs($teacher);

    $response = post(route('teacher.classes.students.store', $class->id), [
        'student_name' => 'Test Student',
        'lrn' => '111222333444',
    ]);

    $response->assertSessionHas('new_student_password');

    $sessionData = session('new_student_password');
    $this->assertNotNull($sessionData['password']);
    $this->assertNotNull($sessionData['username'] ?? null);

    $studentRecord = Student::where('lrn', '111222333444')->first();
    $user = User::find($studentRecord->user_id ?? null);
    $this->assertNotNull($user);
    $this->assertTrue(Hash::check($sessionData['password'], $user->password));
});

test('teacher can upload a classlist and import summary contains generated passwords for newly-created users', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
    ]);

    $csv = "Student Name,LRN\nNew Student,123456789012\nAnother Student,987654321098\n";
    $file = UploadedFile::fake()->createWithContent('classlist.csv', $csv);

    actingAs($teacher);

    $response = post(route('teacher.classes.classlist.store', $class->id), [
        'classlist' => $file,
    ]);

    $response->assertSessionHas('import_summary');

    $summary = session('import_summary');
    $this->assertIsArray($summary['created_students']);
    foreach ($summary['created_students'] as $student) {
        $this->assertArrayHasKey('password', $student);
        $this->assertNotNull($student['password']);
        $user = User::where('username', $student['username'] ?? null)->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check($student['password'], $user->password));
    }
});

test('teacher can start quarter 2 for a class', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);
    $subject = Subject::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'current_quarter' => 1,
    ]);

    actingAs($teacher);

    $response = post(route('teacher.classes.quarter.start', $class->id), [
        'quarter' => 2,
    ]);

    $response->assertSessionHas('success');
    $this->assertEquals(2, $class->fresh()->current_quarter);
});

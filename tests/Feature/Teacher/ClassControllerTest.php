<?php

use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Enrollment;
use App\Models\Subject;
use App\Models\Department;
use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\post;
use function Pest\Laravel\put;
use function Pest\Laravel\assertDatabaseHas;

test('teacher can assign an existing student to a class using LRN', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    /** @var User $studentUser */
    $studentUser = User::factory()->create([
        'first_name' => 'Test',
        'last_name' => 'Student',
        'username' => 'teststudent',
    ]);
    $studentUser->syncRolesByName(['student']);

    Student::factory()->create([
        'user_id' => $studentUser->id,
        'student_name' => 'Test Student',
        'lrn' => '111222333444',
    ]);

    $subject = Subject::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
    ]);

    actingAs($teacher);

    $response = post(route('teacher.classes.students.store', $class->id), [
        'lrn' => '111222333444',
    ]);

    $response->assertSessionHas('success', 'Student assigned to class.');
    $response->assertSessionMissing('new_student_password');

    assertDatabaseHas('enrollments', [
        'class_id' => $class->id,
        'user_id' => $studentUser->id,
    ]);
});

test('teacher can search student by lrn before assigning', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    /** @var User $studentUser */
    $studentUser = User::factory()->create([
        'first_name' => 'Search',
        'last_name' => 'Target',
        'username' => 'searchtarget',
    ]);
    $studentUser->syncRolesByName(['student']);

    Student::factory()->create([
        'user_id' => $studentUser->id,
        'student_name' => 'Search Target',
        'grade_level' => '11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'lrn' => '999888777666',
    ]);

    $subject = Subject::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
    ]);

    actingAs($teacher);

    $response = getJson(route('teacher.classes.students.search', [
        'subjectTeacher' => $class->id,
        'lrn' => '999888777666',
    ]));

    $response
        ->assertOk()
        ->assertJsonPath('student.lrn', '999888777666')
        ->assertJsonPath('student.username', 'searchtarget')
        ->assertJsonPath('student.is_already_assigned', false);
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

    $csv = "Student Name,LRN,Grade Level\nNew Student,123456789012,11\nAnother Student,987654321098,11\n";
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
    $teacher = User::factory()->create([
        'password' => Hash::make('password'),
    ]);
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
        'password' => 'password',
    ]);

    $response->assertSessionHas('success');
    $this->assertEquals(2, $class->fresh()->current_quarter);
});

test('teacher cannot create a duplicate class assignment', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    Department::query()->create([
        'department_name' => 'STEM Department',
        'department_code' => 'STEM',
        'is_active' => true,
    ]);

    $schoolYear = SystemSetting::getCurrentSchoolYear();

    $payload = [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'General Mathematics',
        'color' => 'indigo',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ];

    actingAs($teacher);

    post(route('teacher.classes.store'), $payload)
        ->assertSessionHas('success');

    assertDatabaseHas('classes', [
        'teacher_id' => $teacher->id,
        'grade_level' => '11',
        'section' => 'STEM-A',
        'school_year' => $schoolYear,
        'semester' => (string) SystemSetting::getCurrentSemester(),
    ]);

    $duplicateResponse = post(route('teacher.classes.store'), $payload);

    $duplicateResponse->assertSessionHasErrors('class_duplicate');

    $subjectId = Subject::query()
        ->where('subject_name', 'General Mathematics')
        ->value('id');

    expect($subjectId)->not()->toBeNull();

    $duplicateCount = SchoolClass::query()
        ->where('teacher_id', $teacher->id)
        ->where('subject_id', $subjectId)
        ->where('grade_level', '11')
        ->where('section', 'STEM-A')
        ->where('school_year', $schoolYear)
        ->where('semester', (string) SystemSetting::getCurrentSemester())
        ->count();

    expect($duplicateCount)->toBe(1);
});

test('teacher can create a second class with the same grade and section when subject differs', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    Department::query()->create([
        'department_name' => 'STEM Department',
        'department_code' => 'STEM',
        'is_active' => true,
    ]);

    $schoolYear = SystemSetting::getCurrentSchoolYear();
    $semester = (string) SystemSetting::getCurrentSemester();

    actingAs($teacher);

    post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'General Mathematics',
        'color' => 'indigo',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ])->assertSessionHas('success');

    $secondClassResponse = post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'Earth Science',
        'color' => 'blue',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    $secondClassResponse->assertSessionHas('success');

    $count = SchoolClass::query()
        ->where('teacher_id', $teacher->id)
        ->where('grade_level', '11')
        ->where('section', 'STEM-A')
        ->where('school_year', $schoolYear)
        ->where('semester', $semester)
        ->count();

    expect($count)->toBe(2);
});

test('teacher duplicate check treats subject casing and spacing as the same subject', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    Department::query()->create([
        'department_name' => 'STEM Department',
        'department_code' => 'STEM',
        'is_active' => true,
    ]);

    $schoolYear = SystemSetting::getCurrentSchoolYear();

    actingAs($teacher);

    post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'General Mathematics',
        'color' => 'indigo',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ])->assertSessionHas('success');

    $duplicateResponse = post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => '  general   mathematics  ',
        'color' => 'blue',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    $duplicateResponse->assertSessionHasErrors('class_duplicate');

    $count = SchoolClass::query()
        ->where('teacher_id', $teacher->id)
        ->where('grade_level', '11')
        ->where('section', 'STEM-A')
        ->where('school_year', $schoolYear)
        ->where('semester', (string) SystemSetting::getCurrentSemester())
        ->count();

    expect($count)->toBe(1);
});

test('students from selected section are auto-assigned to a newly created class', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    Department::query()->create([
        'department_name' => 'STEM Department',
        'department_code' => 'STEM',
        'is_active' => true,
    ]);

    $schoolYear = SystemSetting::getCurrentSchoolYear();

    actingAs($teacher);

    post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'General Mathematics',
        'color' => 'indigo',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ])->assertSessionHas('success');

    $sourceSubject = Subject::query()
        ->whereRaw('LOWER(TRIM(subject_name)) = ?', ['general mathematics'])
        ->first();

    expect($sourceSubject)->not()->toBeNull();

    $sourceClass = SchoolClass::query()
        ->where('teacher_id', $teacher->id)
        ->where('subject_id', $sourceSubject->id)
        ->where('grade_level', '11')
        ->where('section', 'STEM-A')
        ->first();

    expect($sourceClass)->not()->toBeNull();

    $studentUser = User::factory()->create();
    $studentUser->syncRolesByName(['student']);

    Student::query()->create([
        'student_name' => 'Sample Student',
        'lrn' => '123123123123',
        'user_id' => $studentUser->id,
        'grade_level' => '11',
        'section' => 'STEM-A',
        'section_id' => $sourceClass->section_id,
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    Enrollment::query()->create([
        'user_id' => $studentUser->id,
        'class_id' => $sourceClass->id,
        'risk_status' => 'low',
    ]);

    $response = post(route('teacher.classes.store'), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => 'Earth Science',
        'color' => 'blue',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    $response->assertSessionHas('success');
    $response->assertSessionHas('import_summary');

    $targetSubject = Subject::query()
        ->whereRaw('LOWER(TRIM(subject_name)) = ?', ['earth science'])
        ->first();

    expect($targetSubject)->not()->toBeNull();

    $targetClass = SchoolClass::query()
        ->where('teacher_id', $teacher->id)
        ->where('subject_id', $targetSubject->id)
        ->where('grade_level', '11')
        ->where('section', 'STEM-A')
        ->latest('id')
        ->first();

    expect($targetClass)->not()->toBeNull();

    assertDatabaseHas('enrollments', [
        'user_id' => $studentUser->id,
        'class_id' => $targetClass->id,
    ]);

    $summary = session('import_summary');
    expect((int) ($summary['assigned_existing'] ?? 0))->toBeGreaterThan(0);
});

test('teacher cannot update a class into a duplicate assignment', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    Department::query()->create([
        'department_name' => 'STEM Department',
        'department_code' => 'STEM',
        'is_active' => true,
    ]);

    $schoolYear = SystemSetting::getCurrentSchoolYear();
    $semester = (string) SystemSetting::getCurrentSemester();

    $mathSubject = Subject::factory()->create([
        'subject_name' => 'General Mathematics',
    ]);

    $scienceSubject = Subject::factory()->create([
        'subject_name' => 'Earth Science',
    ]);

    $existingClass = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $mathSubject->id,
        'grade_level' => '11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'school_year' => $schoolYear,
        'semester' => $semester,
    ]);

    $classToEdit = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $scienceSubject->id,
        'grade_level' => '11',
        'section' => 'STEM-B',
        'strand' => 'STEM',
        'school_year' => $schoolYear,
        'semester' => $semester,
    ]);

    actingAs($teacher);

    $response = put(route('teacher.classes.update', $classToEdit->id), [
        'grade_level' => '11',
        'section' => 'A',
        'subject_name' => $mathSubject->subject_name,
        'color' => 'indigo',
        'school_year' => $schoolYear,
        'strand' => 'STEM',
        'track' => 'Academic',
    ]);

    $response->assertSessionHasErrors('class_duplicate');

    assertDatabaseHas('classes', [
        'id' => $existingClass->id,
        'subject_id' => $mathSubject->id,
        'section' => 'STEM-A',
    ]);

    assertDatabaseHas('classes', [
        'id' => $classToEdit->id,
        'subject_id' => $scienceSubject->id,
        'section' => 'STEM-B',
    ]);
});

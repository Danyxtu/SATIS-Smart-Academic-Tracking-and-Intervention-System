<?php

use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Models\User;
use function Pest\Laravel\actingAs;

test('teacher archive summary endpoint returns grouped school year cards', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);

    $subjectA = Subject::create([
        'subject_name' => 'Mathematics',
        'subject_code' => 'MATH-ARCH',
    ]);

    $subjectB = Subject::create([
        'subject_name' => 'Science',
        'subject_code' => 'SCI-ARCH',
    ]);

    SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'color' => 'indigo',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    SubjectTeacher::create([
        'subject_id' => $subjectB->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-B',
        'strand' => 'STEM',
        'color' => 'blue',
        'school_year' => '2024-2025',
        'semester' => '2',
    ]);

    // Current school year data should not appear in archive summary.
    SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-A',
        'strand' => 'ABM',
        'color' => 'green',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);

    $response = actingAs($teacher)->getJson(route('teacher.classes.archive.summary'));

    $response->assertOk();
    $response->assertJsonPath('current_school_year', '2026-2027');
    $response->assertJsonCount(2, 'archives');
    $response->assertJsonPath('archives.0.school_year', '2025-2026');
    $response->assertJsonPath('archives.1.school_year', '2024-2025');
});

test('teacher archive show endpoint returns semester filtered classes and summary', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);

    $subjectA = Subject::create([
        'subject_name' => 'English',
        'subject_code' => 'ENG-ARCH',
    ]);

    $subjectB = Subject::create([
        'subject_name' => 'History',
        'subject_code' => 'HIS-ARCH',
    ]);

    SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'HUMSS-A',
        'strand' => 'HUMSS',
        'color' => 'red',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    SubjectTeacher::create([
        'subject_id' => $subjectB->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 12',
        'section' => 'HUMSS-B',
        'strand' => 'HUMSS',
        'color' => 'teal',
        'school_year' => '2025-2026',
        'semester' => '2',
    ]);

    $response = actingAs($teacher)->getJson(route('teacher.classes.archive.show', [
        'schoolYear' => '2025-2026',
        'semester' => 2,
    ]));

    $response->assertOk();
    $response->assertJsonPath('school_year', '2025-2026');
    $response->assertJsonPath('selected_semester', 2);
    $response->assertJsonPath('summary.classes_count', 2);
    $response->assertJsonPath('semester1_count', 1);
    $response->assertJsonPath('semester2_count', 1);
    $response->assertJsonCount(1, 'classes');
    $response->assertJsonPath('classes.0.subject', 'History');
    $response->assertJsonPath('classes.0.semester', '2');
});

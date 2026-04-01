<?php

use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Models\User;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
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

test('teacher can add selected archived classes into the active school year', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
    SystemSetting::set('current_semester', 1, $teacher->id);

    $subjectA = Subject::create([
        'subject_name' => 'Oral Communication',
        'subject_code' => 'ORCOM-ARCH',
    ]);

    $subjectB = Subject::create([
        'subject_name' => 'General Mathematics',
        'subject_code' => 'GENMATH-ARCH',
    ]);

    $archivedClassA = SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'color' => 'indigo',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    $archivedClassB = SubjectTeacher::create([
        'subject_id' => $subjectB->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-B',
        'strand' => 'ABM',
        'color' => 'blue',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    $response = actingAs($teacher)->postJson(route('teacher.classes.archive.use'), [
        'school_year' => '2025-2026',
        'semester' => '1',
        'class_ids' => [$archivedClassA->id, $archivedClassB->id],
    ]);

    $response->assertOk();
    $response->assertJsonPath('summary.created_count', 2);
    $response->assertJsonPath('summary.skipped_duplicate_count', 0);
    $response->assertJsonPath('summary.skipped_missing_count', 0);

    assertDatabaseHas('subject_teachers', [
        'teacher_id' => $teacher->id,
        'subject_id' => $subjectA->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-A',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);

    assertDatabaseHas('subject_teachers', [
        'teacher_id' => $teacher->id,
        'subject_id' => $subjectB->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-B',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);
});

test('teacher archive reuse skips classes that already exist in active school year', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
    SystemSetting::set('current_semester', 1, $teacher->id);

    $subjectA = Subject::create([
        'subject_name' => 'Earth Science',
        'subject_code' => 'EARTH-ARCH',
    ]);

    $subjectB = Subject::create([
        'subject_name' => 'Physical Science',
        'subject_code' => 'PHYS-ARCH',
    ]);

    $duplicateArchivedClass = SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-C',
        'strand' => 'STEM',
        'color' => 'green',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    $newArchivedClass = SubjectTeacher::create([
        'subject_id' => $subjectB->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-D',
        'strand' => 'STEM',
        'color' => 'teal',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    SubjectTeacher::create([
        'subject_id' => $subjectA->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-C',
        'strand' => 'STEM',
        'color' => 'red',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);

    $response = actingAs($teacher)->postJson(route('teacher.classes.archive.use'), [
        'school_year' => '2025-2026',
        'semester' => '1',
        'class_ids' => [$duplicateArchivedClass->id, $newArchivedClass->id],
    ]);

    $response->assertOk();
    $response->assertJsonPath('summary.created_count', 1);
    $response->assertJsonPath('summary.skipped_duplicate_count', 1);

    assertDatabaseHas('subject_teachers', [
        'teacher_id' => $teacher->id,
        'subject_id' => $subjectB->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-D',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);
});

test('teacher archive reuse blocks second semester classes when second semester has not started', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
    SystemSetting::set('current_semester', 1, $teacher->id);

    $subject = Subject::create([
        'subject_name' => 'Statistics',
        'subject_code' => 'STAT-ARCH',
    ]);

    $archivedSecondSemesterClass = SubjectTeacher::create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-A',
        'strand' => 'ABM',
        'color' => 'amber',
        'school_year' => '2025-2026',
        'semester' => '2',
    ]);

    $response = actingAs($teacher)->postJson(route('teacher.classes.archive.use'), [
        'school_year' => '2025-2026',
        'semester' => '2',
        'class_ids' => [$archivedSecondSemesterClass->id],
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath(
        'message',
        'Second semester should start to proceed with this operation.',
    );

    assertDatabaseMissing('subject_teachers', [
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-A',
        'school_year' => '2026-2027',
        'semester' => '2',
    ]);
});

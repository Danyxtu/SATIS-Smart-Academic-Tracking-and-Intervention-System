<?php

use App\Models\Subject;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Models\User;
use function Pest\Laravel\actingAs;
use Inertia\Testing\AssertableInertia as Assert;

test('my classes only shows assignments for the active school year', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    SystemSetting::set('current_school_year', '2026-2027', $teacher->id);
    SystemSetting::set('current_semester', 1, $teacher->id);

    $currentSemOneSubject = Subject::create([
        'subject_name' => 'Current SY Semester One',
        'subject_code' => 'CUR-S1',
    ]);

    $currentSemTwoSubject = Subject::create([
        'subject_name' => 'Current SY Semester Two',
        'subject_code' => 'CUR-S2',
    ]);

    $archivedSubject = Subject::create([
        'subject_name' => 'Archived School Year Subject',
        'subject_code' => 'OLD-S1',
    ]);

    SubjectTeacher::create([
        'subject_id' => $currentSemOneSubject->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'STEM-A',
        'strand' => 'STEM',
        'color' => 'indigo',
        'school_year' => '2026-2027',
        'semester' => '1',
    ]);

    SubjectTeacher::create([
        'subject_id' => $currentSemTwoSubject->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 12',
        'section' => 'ABM-B',
        'strand' => 'ABM',
        'color' => 'blue',
        'school_year' => '2026-2027',
        'semester' => '2',
    ]);

    SubjectTeacher::create([
        'subject_id' => $archivedSubject->id,
        'teacher_id' => $teacher->id,
        'grade_level' => 'Grade 11',
        'section' => 'TVL-C',
        'strand' => 'TVL',
        'color' => 'green',
        'school_year' => '2025-2026',
        'semester' => '1',
    ]);

    $response = actingAs($teacher)->get(route('teacher.classes.index'));

    $response->assertOk();
    $response->assertInertia(fn(Assert $page) => $page
        ->component('Teacher/MyClasses')
        ->where('defaultSchoolYear', '2026-2027')
        ->where('currentSemester', 1)
        ->where('selectedSemester', 1)
        ->where('semester1Count', 1)
        ->where('semester2Count', 1)
        ->has('classes', 1)
        ->where('classes.0.subject', 'Current SY Semester One')
        ->where('classes.0.school_year', '2026-2027'));

    $semesterTwoResponse = actingAs($teacher)->get(route('teacher.classes.index', ['semester' => 2]));

    $semesterTwoResponse->assertOk();
    $semesterTwoResponse->assertInertia(fn(Assert $page) => $page
        ->component('Teacher/MyClasses')
        ->where('selectedSemester', 2)
        ->has('classes', 1)
        ->where('classes.0.subject', 'Current SY Semester Two')
        ->where('classes.0.school_year', '2026-2027'));
});

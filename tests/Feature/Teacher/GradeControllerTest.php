<?php

use App\Models\Enrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

function buildQuarterGradeCategoriesForTests(): array
{
    return [
        [
            'id' => 'written_works',
            'label' => 'Written Works',
            'weight' => 0.30,
            'tasks' => [
                ['id' => 'ww1', 'label' => 'WW 1', 'total' => 100],
            ],
        ],
        [
            'id' => 'performance_task',
            'label' => 'Performance Task',
            'weight' => 0.40,
            'tasks' => [
                ['id' => 'pt1', 'label' => 'PT 1', 'total' => 100],
            ],
        ],
        [
            'id' => 'quarterly_exam',
            'label' => 'Quarterly Exam',
            'weight' => 0.30,
            'tasks' => [
                ['id' => 'qe1', 'label' => 'QE 1', 'total' => 100],
            ],
        ],
    ];
}

test('bulk grade save auto-fills blank activities with zero once quarterly exam is scored', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create();
    $categories = buildQuarterGradeCategoriesForTests();

    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'grade_categories' => [
            '1' => $categories,
            '2' => $categories,
        ],
    ]);

    /** @var User $studentUser */
    $studentUser = User::factory()->create();
    $studentUser->syncRolesByName(['student']);

    Student::factory()->create([
        'user_id' => $studentUser->id,
        'lrn' => '100000000001',
    ]);

    $enrollment = Enrollment::create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
    ]);

    actingAs($teacher);

    $response = post(route('teacher.classes.grades.bulk', $class->id), [
        'grades' => [
            [
                'enrollment_id' => $enrollment->id,
                'assignment_id' => 'qe1',
                'score' => 88,
                'quarter' => 1,
            ],
        ],
    ]);

    $response->assertSessionHas('success');
    $response->assertSessionHas('grade_update_summary');

    expect(session('grade_update_summary.auto_filled'))->toBe(2);

    assertDatabaseHas('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'qe1',
        'quarter' => 1,
        'score' => 88,
    ]);

    assertDatabaseHas('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'ww1',
        'quarter' => 1,
        'score' => 0,
    ]);

    assertDatabaseHas('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'pt1',
        'quarter' => 1,
        'score' => 0,
    ]);
});

test('bulk grade save does not auto-fill blanks when quarterly exam is missing', function () {
    /** @var User $teacher */
    $teacher = User::factory()->create();
    $teacher->syncRolesByName(['teacher']);

    $subject = Subject::factory()->create();
    $categories = buildQuarterGradeCategoriesForTests();

    $class = SchoolClass::factory()->create([
        'teacher_id' => $teacher->id,
        'subject_id' => $subject->id,
        'grade_categories' => [
            '1' => $categories,
            '2' => $categories,
        ],
    ]);

    /** @var User $studentUser */
    $studentUser = User::factory()->create();
    $studentUser->syncRolesByName(['student']);

    Student::factory()->create([
        'user_id' => $studentUser->id,
        'lrn' => '100000000002',
    ]);

    $enrollment = Enrollment::create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
    ]);

    actingAs($teacher);

    $response = post(route('teacher.classes.grades.bulk', $class->id), [
        'grades' => [
            [
                'enrollment_id' => $enrollment->id,
                'assignment_id' => 'ww1',
                'score' => 75,
                'quarter' => 1,
            ],
        ],
    ]);

    $response->assertSessionHas('success');
    $response->assertSessionHas('grade_update_summary');

    expect(session('grade_update_summary.auto_filled'))->toBe(0);

    assertDatabaseHas('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'ww1',
        'quarter' => 1,
        'score' => 75,
    ]);

    assertDatabaseMissing('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'pt1',
        'quarter' => 1,
    ]);

    assertDatabaseMissing('grades', [
        'enrollment_id' => $enrollment->id,
        'assignment_key' => 'qe1',
        'quarter' => 1,
    ]);
});

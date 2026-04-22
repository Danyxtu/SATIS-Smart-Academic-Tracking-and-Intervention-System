<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\TemporaryCredentials;
use App\Mail\TeacherCredentials;
use App\Models\Enrollment;
use App\Models\PasswordResetRequest;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('roles:id,name', 'department:id,department_name,department_code');
        $countQuery = User::query();
        $currentSchoolYear = (string) SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name',  'like', "%{$search}%")
                    ->orWhere('username',   'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });

            $countQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name',  'like', "%{$search}%")
                    ->orWhere('username',   'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $pageUsers = $users->getCollection();
        $teacherUserIds = $pageUsers
            ->filter(function (User $user) {
                return $user->roles->contains('name', 'teacher');
            })
            ->pluck('id')
            ->values()
            ->all();
        $studentUserIds = $pageUsers
            ->filter(function (User $user) {
                return $user->roles->contains('name', 'student');
            })
            ->pluck('id')
            ->values()
            ->all();

        $advisorySectionsByTeacher = collect();
        $teachingClassesByTeacher = collect();
        $studentProfilesByUserId = collect();
        $studentClassesByUserId = collect();

        if (!empty($teacherUserIds)) {
            $advisorySectionsByTeacher = Section::query()
                ->whereIn('advisor_teacher_id', $teacherUserIds)
                ->where('school_year', $currentSchoolYear)
                ->with([
                    'classes' => function ($query) {
                        $query->select([
                            'id',
                            'section_id',
                            'subject_id',
                            'teacher_id',
                            'school_year',
                            'semester',
                            'grade_level',
                            'section',
                            'strand',
                            'track',
                        ])
                            ->withCount('enrollments')
                            ->with([
                                'subject:id,subject_name,subject_code,semester,grade_level',
                                'teacher:id,first_name,middle_name,last_name',
                            ])
                            ->orderBy('semester')
                            ->orderBy('id');
                    },
                ])
                ->orderBy('grade_level')
                ->orderBy('section_name')
                ->get()
                ->groupBy('advisor_teacher_id');

            $teachingClassesByTeacher = SchoolClass::query()
                ->whereIn('teacher_id', $teacherUserIds)
                ->where('school_year', $currentSchoolYear)
                ->withCount('enrollments')
                ->with([
                    'subject:id,subject_name,subject_code,semester,grade_level',
                    'sectionRecord:id,section_name,section_code,grade_level,strand,track,school_year',
                ])
                ->orderBy('grade_level')
                ->orderBy('section')
                ->orderBy('semester')
                ->get()
                ->groupBy('teacher_id');
        }

        if (!empty($studentUserIds)) {
            $studentProfilesByUserId = Student::query()
                ->whereIn('user_id', $studentUserIds)
                ->with([
                    'sectionRecord:id,section_name,section_code,grade_level,strand,track,school_year',
                ])
                ->get()
                ->keyBy('user_id');

            $studentClassesByUserId = Enrollment::query()
                ->select([
                    'id',
                    'user_id',
                    'class_id',
                    'q1_grade',
                    'q2_grade',
                    'final_grade',
                    'remarks',
                ])
                ->whereIn('user_id', $studentUserIds)
                ->whereHas('schoolClass', function ($query) use ($currentSchoolYear) {
                    $query->where('school_year', $currentSchoolYear);
                })
                ->with([
                    'schoolClass' => function ($query) {
                        $query->select([
                            'id',
                            'subject_id',
                            'teacher_id',
                            'section_id',
                            'school_year',
                            'semester',
                            'grade_level',
                            'section',
                            'strand',
                            'track',
                        ])
                            ->with([
                                'subject:id,subject_name,subject_code,semester,grade_level',
                                'teacher:id,first_name,middle_name,last_name',
                                'sectionRecord:id,section_name,section_code,grade_level,strand,track,school_year',
                            ]);
                    },
                ])
                ->get()
                ->groupBy('user_id');
        }

        $users->getCollection()->transform(function (User $user) use (
            $advisorySectionsByTeacher,
            $teachingClassesByTeacher,
            $studentProfilesByUserId,
            $studentClassesByUserId,
            $currentSchoolYear,
            $currentSemester,
        ) {
            $roleNames = $user->roles->pluck('name')->values();
            $roleNamesOrdered = $roleNames->contains('teacher')
                ? collect(['teacher'])
                ->merge($roleNames->reject(function ($roleName) {
                    return $roleName === 'teacher';
                }))
                ->values()
                : $roleNames;

            $payload = $user->toArray();
            $payload['role'] = $roleNamesOrdered->first();
            $payload['roles_list'] = $roleNamesOrdered->all();
            $payload['current_school_year'] = $currentSchoolYear;
            $payload['current_semester'] = $currentSemester;

            if ($roleNames->contains('teacher')) {
                $advisoryClasses = collect($advisorySectionsByTeacher->get($user->id, collect()))
                    ->map(function (Section $section) {
                        $specialization = $section->track ?: ($section->strand ?: null);
                        $sectionLabel = satis_section_full_label(
                            $section->grade_level,
                            $specialization,
                            $section->section_name,
                        );

                        $classes = $section->classes
                            ->map(function (SchoolClass $classEntry) {
                                return [
                                    'id' => (int) $classEntry->id,
                                    'subject_id' => $classEntry->subject_id ? (int) $classEntry->subject_id : null,
                                    'subject_name' => $classEntry->subject?->subject_name,
                                    'subject_code' => $classEntry->subject?->subject_code,
                                    'semester' => $classEntry->semester === null ? null : (string) $classEntry->semester,
                                    'teacher_id' => $classEntry->teacher_id ? (int) $classEntry->teacher_id : null,
                                    'teacher_name' => $classEntry->teacher?->name,
                                    'students_count' => (int) ($classEntry->enrollments_count ?? 0),
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => (int) $section->id,
                            'section_id' => (int) $section->id,
                            'section_name' => $section->section_name,
                            'section_code' => $section->section_code,
                            'section_label' => $sectionLabel,
                            'grade_level' => $section->grade_level,
                            'strand' => $section->strand,
                            'track' => $section->track,
                            'school_year' => $section->school_year,
                            'classes_count' => count($classes),
                            'classes' => $classes,
                        ];
                    })
                    ->values()
                    ->all();

                $teachingClasses = collect($teachingClassesByTeacher->get($user->id, collect()))
                    ->map(function (SchoolClass $classEntry) {
                        $section = $classEntry->sectionRecord;
                        $subject = $classEntry->subject;

                        $sectionName = $section?->section_name ?: $classEntry->section;
                        $gradeLevel = $section?->grade_level ?: $classEntry->grade_level;
                        $strand = $section?->strand ?: $classEntry->strand;
                        $track = $section?->track ?: $classEntry->track;
                        $specialization = $track ?: ($strand ?: null);

                        return [
                            'id' => (int) $classEntry->id,
                            'section_id' => $classEntry->section_id ? (int) $classEntry->section_id : null,
                            'section_name' => $sectionName,
                            'section_code' => $section?->section_code,
                            'section_label' => satis_section_full_label(
                                $gradeLevel,
                                $specialization,
                                $sectionName,
                            ),
                            'subject_id' => $classEntry->subject_id ? (int) $classEntry->subject_id : null,
                            'subject_name' => $subject?->subject_name,
                            'subject_code' => $subject?->subject_code,
                            'semester' => $classEntry->semester === null ? null : (string) $classEntry->semester,
                            'school_year' => $classEntry->school_year,
                            'grade_level' => $gradeLevel,
                            'strand' => $strand,
                            'track' => $track,
                            'students_count' => (int) ($classEntry->enrollments_count ?? 0),
                        ];
                    })
                    ->values()
                    ->all();

                $payload['teacher_advisory_classes'] = $advisoryClasses;
                $payload['teacher_teaching_classes'] = $teachingClasses;
            } else {
                $payload['teacher_advisory_classes'] = [];
                $payload['teacher_teaching_classes'] = [];
            }

            if ($roleNames->contains('student')) {
                /** @var Student|null $studentProfile */
                $studentProfile = $studentProfilesByUserId->get($user->id);
                $sectionRecord = $studentProfile?->sectionRecord;

                $sectionName = $sectionRecord?->section_name ?: $studentProfile?->section;
                $gradeLevel = $sectionRecord?->grade_level ?: $studentProfile?->grade_level;
                $strand = $sectionRecord?->strand ?: $studentProfile?->strand;
                $track = $sectionRecord?->track ?: $studentProfile?->track;
                $specialization = $track ?: ($strand ?: null);

                $payload['student_section'] = [
                    'student_id' => $studentProfile?->id ? (int) $studentProfile->id : null,
                    'section_id' => $sectionRecord?->id ? (int) $sectionRecord->id : null,
                    'section_name' => $sectionName,
                    'section_code' => $sectionRecord?->section_code,
                    'section_label' => $sectionName
                        ? satis_section_full_label(
                            $gradeLevel,
                            $specialization,
                            $sectionName,
                        )
                        : null,
                    'grade_level' => $gradeLevel,
                    'strand' => $strand,
                    'track' => $track,
                    'school_year' => $sectionRecord?->school_year,
                    'lrn' => $studentProfile?->lrn,
                    'parent_contact_number' => $studentProfile?->parent_contact_number,
                ];

                $studentClasses = collect($studentClassesByUserId->get($user->id, collect()))
                    ->map(function (Enrollment $enrollment) {
                        $schoolClass = $enrollment->schoolClass;
                        if (! $schoolClass) {
                            return null;
                        }

                        $subject = $schoolClass->subject;
                        $teacher = $schoolClass->teacher;
                        $sectionRecord = $schoolClass->sectionRecord;

                        $sectionName = $sectionRecord?->section_name ?: $schoolClass->section;
                        $gradeLevel = $sectionRecord?->grade_level ?: $schoolClass->grade_level;
                        $strand = $sectionRecord?->strand ?: $schoolClass->strand;
                        $track = $sectionRecord?->track ?: $schoolClass->track;
                        $specialization = $track ?: ($strand ?: null);

                        return [
                            'enrollment_id' => (int) $enrollment->id,
                            'class_id' => (int) $schoolClass->id,
                            'school_year' => $schoolClass->school_year,
                            'semester' => $schoolClass->semester === null ? null : (string) $schoolClass->semester,
                            'grade_level' => $gradeLevel,
                            'strand' => $strand,
                            'track' => $track,
                            'section_id' => $schoolClass->section_id ? (int) $schoolClass->section_id : null,
                            'section_name' => $sectionName,
                            'section_code' => $sectionRecord?->section_code,
                            'section_label' => $sectionName
                                ? satis_section_full_label(
                                    $gradeLevel,
                                    $specialization,
                                    $sectionName,
                                )
                                : null,
                            'subject_id' => $schoolClass->subject_id ? (int) $schoolClass->subject_id : null,
                            'subject_name' => $subject?->subject_name,
                            'subject_code' => $subject?->subject_code,
                            'teacher_id' => $schoolClass->teacher_id ? (int) $schoolClass->teacher_id : null,
                            'teacher_name' => $teacher?->name,
                            'midterm_grade' => $enrollment->q1_grade === null ? null : (int) $enrollment->q1_grade,
                            'final_quarter_grade' => $enrollment->q2_grade === null ? null : (int) $enrollment->q2_grade,
                            'final_grade' => $enrollment->final_grade === null ? null : (int) $enrollment->final_grade,
                            'remarks' => $enrollment->remarks,
                        ];
                    })
                    ->filter()
                    ->sortBy(function (array $entry) {
                        $semesterOrder = $entry['semester'] === '2'
                            ? 2
                            : ($entry['semester'] === '1' ? 1 : 9);

                        return sprintf(
                            '%02d|%s|%s',
                            $semesterOrder,
                            strtolower((string) ($entry['subject_name'] ?? '')),
                            strtolower((string) ($entry['section_label'] ?? '')),
                        );
                    })
                    ->values()
                    ->all();

                $payload['student_classes'] = $studentClasses;
            } else {
                $payload['student_section'] = null;
                $payload['student_classes'] = [];
            }

            return $payload;
        });

        $roleCounts = [
            'super_admin' => 0,
            'admin' => 0,
            'teacher' => 0,
            'student' => 0,
        ];

        $roleCountRows = $countQuery
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->select('roles.name', DB::raw('COUNT(DISTINCT users.id) as total'))
            ->groupBy('roles.name')
            ->pluck('total', 'name')
            ->toArray();

        $studentCreationBaseCount = User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'student');
            })
            ->count();

        $usernameYear = now()->format('Y');
        $usernamePattern = '/^([a-z]{2}' . preg_quote($usernameYear, '/') . ')(\d{5})$/';

        $studentUsernameLatestByPrefix = User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'student');
            })
            ->whereNotNull('username')
            ->where('username', 'like', '__' . $usernameYear . '%')
            ->pluck('username')
            ->reduce(function (array $carry, $username) use ($usernamePattern) {
                if (! is_string($username)) {
                    return $carry;
                }

                if (preg_match($usernamePattern, $username, $matches) !== 1) {
                    return $carry;
                }

                $prefix = (string) ($matches[1] ?? '');
                $sequence = (int) ($matches[2] ?? 0);

                if ($prefix === '') {
                    return $carry;
                }

                $carry[$prefix] = max((int) ($carry[$prefix] ?? 0), $sequence);

                return $carry;
            }, []);

        foreach ($roleCountRows as $roleName => $total) {
            if (array_key_exists($roleName, $roleCounts)) {
                $roleCounts[$roleName] = (int) $total;
            }
        }

        $departments = \App\Models\Department::query()
            ->withCount([
                'users as admin_count' => function ($query) {
                    $query->whereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'admin');
                    });
                },
            ])
            ->with([
                'admins:id,first_name,middle_name,last_name,personal_email,department_id',
            ])
            ->orderBy('department_name')
            ->get()
            ->map(function (\App\Models\Department $department) {
                $primaryAdmin = $department->admins->first();

                $department->setAttribute('department_admin', $primaryAdmin ? [
                    'id' => $primaryAdmin->id,
                    'first_name' => $primaryAdmin->first_name,
                    'last_name' => $primaryAdmin->last_name,
                    'name' => $primaryAdmin->name,
                    'email' => $primaryAdmin->email,
                ] : null);

                return $department;
            });

        $sections = Section::query()
            ->with('department:id,department_name,department_code')
            ->where('is_active', true)
            ->orderBy('school_year', 'desc')
            ->orderBy('grade_level')
            ->orderBy('section_name')
            ->get()
            ->map(function (Section $section) {
                $departmentCode = $section->department?->department_code;
                $specialization = $section->track ?: ($section->strand ?: $departmentCode);

                return [
                    'id' => (int) $section->id,
                    'department_id' => $section->department_id ? (int) $section->department_id : null,
                    'department_name' => $section->department?->department_name,
                    'department_code' => $section->department?->department_code,
                    'section_name' => $section->section_name,
                    'section_code' => $section->section_code,
                    'grade_level' => $section->grade_level,
                    'strand' => $section->strand,
                    'track' => $section->track,
                    'school_year' => $section->school_year,
                    'section_full_label' => satis_section_full_label(
                        $section->grade_level,
                        $specialization,
                        $section->section_name,
                    ),
                ];
            })
            ->values();

        return Inertia::render('SuperAdmin/UserManagement/Index', [
            'users'       => $users,
            'departments' => $departments,
            'sections'    => $sections,
            'filters'     => $request->only('search', 'role'),
            'roleCounts'  => $roleCounts,
            'studentCreationBaseCount' => $studentCreationBaseCount,
            'studentUsernameLatestByPrefix' => $studentUsernameLatestByPrefix,
        ]);
    }

    public function store(Request $request)
    {
        $superAdmin = Auth::user();

        $role = (string) $request->input('role', '');
        $teacherMode = (string) $request->input('teacher_mode', 'single');
        $studentMode = (string) $request->input('student_mode', 'single');

        if ($role === 'teacher' && $teacherMode === 'multiple') {
            $validated = $request->validate([
                'role' => ['required', 'in:teacher'],
                'teacher_mode' => ['required', 'in:multiple'],
                'teacher_queue' => ['required', 'array', 'min:1'],
                'teacher_queue.*.first_name' => ['required', 'string', 'max:100'],
                'teacher_queue.*.last_name' => ['required', 'string', 'max:100'],
                'teacher_queue.*.middle_name' => ['nullable', 'string', 'max:100'],
                'teacher_queue.*.email' => ['required', 'email', 'max:255', 'distinct', 'unique:users,personal_email'],
                'teacher_queue.*.department_id' => ['required', 'exists:departments,id'],
                'teacher_queue.*.assign_as_admin' => ['nullable', 'boolean'],
            ]);

            $departmentIds = collect($validated['teacher_queue'])
                ->pluck('department_id')
                ->filter()
                ->unique()
                ->values();

            $departments = \App\Models\Department::query()
                ->whereIn('id', $departmentIds)
                ->withCount('admins')
                ->get()
                ->keyBy('id');

            $pendingAdminDepartmentIds = [];

            foreach ($validated['teacher_queue'] as $index => $teacherPayload) {
                $wantsAdmin = (bool) ($teacherPayload['assign_as_admin'] ?? false);

                if (! $wantsAdmin) {
                    continue;
                }

                $departmentId = (int) $teacherPayload['department_id'];
                $existingAdminCount = (int) ($departments[$departmentId]->admins_count ?? 0);

                if ($existingAdminCount > 0 || in_array($departmentId, $pendingAdminDepartmentIds, true)) {
                    return back()->withErrors([
                        "teacher_queue.{$index}.assign_as_admin" => 'This department already has an assigned admin.',
                    ]);
                }

                $pendingAdminDepartmentIds[] = $departmentId;
            }

            try {
                DB::transaction(function () use ($validated, $superAdmin) {
                    foreach ($validated['teacher_queue'] as $teacherPayload) {
                        $assignedRoles = ['teacher'];

                        if (!empty($teacherPayload['assign_as_admin'])) {
                            $assignedRoles[] = 'admin';
                        }

                        $tempPassword = $this->generateTemporaryPassword(12);

                        $teacher = User::create([
                            'first_name' => $teacherPayload['first_name'],
                            'last_name' => $teacherPayload['last_name'],
                            'middle_name' => $teacherPayload['middle_name'] ?? null,
                            'personal_email' => $teacherPayload['email'] ?? null,
                            'temporary_password' => $tempPassword,
                            'password' => Hash::make($tempPassword),
                            'department_id' => $teacherPayload['department_id'],
                            'must_change_password' => true,
                            'email_verified_at' => null,
                            'status' => 'active',
                            'created_by' => $superAdmin->id,
                            'username' => null,
                        ]);

                        $roleIds = Role::whereIn('name', $assignedRoles)->pluck('id')->all();
                        if (!empty($roleIds)) {
                            $teacher->roles()->sync($roleIds);
                        }

                        Mail::to($teacher->email)->send(new TeacherCredentials(
                            teacher: $teacher,
                            plainPassword: $tempPassword,
                            issuedBy: $superAdmin,
                        ));
                    }
                });
            } catch (\Throwable $exception) {
                report($exception);

                return back()->withErrors([
                    'teacher_queue' => 'Unable to create teacher accounts and send credentials right now. Please try again.',
                ]);
            }

            $createdCount = count($validated['teacher_queue']);
            $label = $createdCount === 1 ? 'teacher' : 'teachers';

            return redirect()->route('superadmin.users.index')
                ->with('success', "{$createdCount} {$label} created successfully. Login credentials were sent via email.");
        }

        if ($role === 'student' && in_array($studentMode, ['multiple', 'csv'], true)) {
            $validated = $request->validate([
                'role' => ['required', 'in:student'],
                'student_mode' => ['required', 'in:multiple,csv'],
                'section_id' => ['required', 'exists:sections,id'],
                'password' => ['required', Password::min(8)],
                'student_queue' => ['required', 'array', 'min:1'],
                'student_queue.*.first_name' => ['required', 'string', 'max:100'],
                'student_queue.*.last_name' => ['required', 'string', 'max:100'],
                'student_queue.*.middle_name' => ['nullable', 'string', 'max:100'],
                'student_queue.*.lrn' => ['required', 'string', 'size:12', 'distinct', 'unique:students,lrn'],
                'student_queue.*.parent_contact_number' => ['nullable', 'string', 'max:40'],
                'student_queue.*.email' => ['nullable', 'email', 'max:255', 'distinct', 'unique:users,personal_email'],
                'student_queue.*.username' => ['required', 'string', 'regex:/^[a-z]{2}\d{4}\d{5}$/', 'distinct'],
            ]);

            foreach ($validated['student_queue'] as $index => $studentPayload) {
                $isUsernameValidForPayload = $this->isValidStudentUsernameForName(
                    (string) ($studentPayload['username'] ?? ''),
                    (string) ($studentPayload['first_name'] ?? ''),
                    (string) ($studentPayload['last_name'] ?? ''),
                );

                if (! $isUsernameValidForPayload) {
                    return back()->withErrors([
                        "student_queue.{$index}.username" => 'Username format must follow initials + current year + 5-digit number (example: dd202300100).',
                    ]);
                }
            }

            $selectedSection = Section::query()->findOrFail((int) $validated['section_id']);

            $createdStudentCredentials = [];

            DB::transaction(function () use ($validated, $selectedSection, $superAdmin, &$createdStudentCredentials) {
                foreach ($validated['student_queue'] as $studentPayload) {
                    $resolvedUsername = $this->resolveNextStudentUsername(
                        (string) ($studentPayload['first_name'] ?? ''),
                        (string) ($studentPayload['last_name'] ?? ''),
                    );

                    $student = User::create([
                        'first_name' => $studentPayload['first_name'],
                        'last_name' => $studentPayload['last_name'],
                        'middle_name' => $studentPayload['middle_name'] ?? null,
                        'personal_email' => $studentPayload['email'] ?? null,
                        'username' => $resolvedUsername,
                        'temporary_password' => $validated['password'],
                        'password' => Hash::make($validated['password']),
                        'department_id' => $selectedSection->department_id,
                        'must_change_password' => true,
                        'status' => 'active',
                        'created_by' => $superAdmin->id,
                    ]);

                    $roleIds = Role::whereIn('name', ['student'])->pluck('id')->all();
                    if (! empty($roleIds)) {
                        $student->roles()->sync($roleIds);
                    }

                    $studentName = trim(implode(' ', array_filter([
                        $studentPayload['first_name'] ?? null,
                        $studentPayload['middle_name'] ?? null,
                        $studentPayload['last_name'] ?? null,
                    ])));

                    Student::create([
                        'user_id' => $student->id,
                        'student_name' => $studentName,
                        'lrn' => (string) $studentPayload['lrn'],
                        'parent_contact_number' => isset($studentPayload['parent_contact_number'])
                            ? (trim((string) $studentPayload['parent_contact_number']) ?: null)
                            : null,
                    ] + $this->buildStudentSectionAttributes($selectedSection));

                    $createdStudentCredentials[] = [
                        'id' => $student->id,
                        'first_name' => (string) ($studentPayload['first_name'] ?? ''),
                        'middle_name' => (string) ($studentPayload['middle_name'] ?? ''),
                        'last_name' => (string) ($studentPayload['last_name'] ?? ''),
                        'full_name' => $studentName,
                        'lrn' => (string) ($studentPayload['lrn'] ?? ''),
                        'username' => (string) ($student->username ?? ''),
                        'password' => (string) ($validated['password'] ?? ''),
                    ];
                }
            });

            $createdCount = count($validated['student_queue']);
            $label = $createdCount === 1 ? 'student' : 'students';

            return redirect()->route('superadmin.users.index')
                ->with('success', "{$createdCount} {$label} created successfully.")
                ->with('created_student_credentials', $createdStudentCredentials);
        }

        $validated = $request->validate([
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'lrn'           => ['nullable', 'string', 'size:12', 'unique:students,lrn'],
            'parent_contact_number' => ['nullable', 'string', 'max:40'],
            'email'         => ['nullable', 'email', 'unique:users,personal_email'],
            'username'      => ['nullable', 'string', 'regex:/^[a-z]{2}\d{4}\d{5}$/'],
            'password'      => ['nullable', Password::min(8)],
            'role'          => ['required', 'in:teacher,student'],
            'teacher_mode'  => ['nullable', 'in:single,multiple'],
            'student_mode'  => ['nullable', 'in:single,multiple,csv'],
            'section_id'    => ['nullable', 'exists:sections,id'],
            'assign_as_admin' => ['nullable', 'boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        if ($validated['role'] === 'teacher' && empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Department is required for teachers.',
            ]);
        }

        if ($validated['role'] === 'teacher' && empty($validated['email'])) {
            return back()->withErrors([
                'email' => 'Email is required for teachers.',
            ]);
        }

        if (
            $validated['role'] === 'teacher'
            && !empty($validated['assign_as_admin'])
            && !empty($validated['department_id'])
        ) {
            $departmentAlreadyHasAdmin = \App\Models\Department::query()
                ->whereKey($validated['department_id'])
                ->whereHas('admins')
                ->exists();

            if ($departmentAlreadyHasAdmin) {
                return back()->withErrors([
                    'assign_as_admin' => 'This department already has an assigned admin.',
                ]);
            }
        }

        if ($validated['role'] === 'student') {
            if (($validated['student_mode'] ?? 'single') !== 'single') {
                return back()->withErrors([
                    'student_mode' => 'Invalid student mode for single student creation.',
                ]);
            }

            if (empty($validated['password'])) {
                return back()->withErrors([
                    'password' => 'Password is required for single student creation.',
                ]);
            }

            if (empty($validated['section_id'])) {
                return back()->withErrors([
                    'section_id' => 'Section assignment is required for students.',
                ]);
            }

            if (empty($validated['lrn'])) {
                return back()->withErrors([
                    'lrn' => 'LRN is required for single student creation.',
                ]);
            }
        }

        $selectedSection = null;
        if ($validated['role'] === 'student') {
            $selectedSection = Section::query()->findOrFail((int) $validated['section_id']);
        }

        if ($validated['role'] === 'teacher') {
            $assignedRoles = ['teacher'];

            if (!empty($validated['assign_as_admin'])) {
                $assignedRoles[] = 'admin';
            }
        } else {
            $assignedRoles = ['student'];
        }

        $teacherTempPassword = $validated['role'] === 'teacher'
            ? $this->generateTemporaryPassword(12)
            : null;

        $resolvedPassword = $validated['role'] === 'teacher'
            ? $teacherTempPassword
            : (string) ($validated['password'] ?? '');

        $resolvedStudentUsername = $validated['role'] === 'student'
            ? $this->resolveNextStudentUsername(
                (string) ($validated['first_name'] ?? ''),
                (string) ($validated['last_name'] ?? ''),
            )
            : null;

        $user = User::create([
            'first_name'           => $validated['first_name'],
            'last_name'            => $validated['last_name'],
            'middle_name'          => $validated['middle_name'] ?? null,
            'personal_email'       => $validated['email'] ?? null,
            'temporary_password'   => $validated['role'] === 'student'
                ? $validated['password']
                : $teacherTempPassword,
            'password'             => Hash::make($resolvedPassword),
            'department_id'        => $validated['role'] === 'teacher'
                ? $validated['department_id']
                : ($selectedSection ? $selectedSection->department_id : null),
            'must_change_password' => true,
            'email_verified_at'    => null,
            'status'               => 'active',
            'created_by'           => $superAdmin->id,
            'username'             => $validated['role'] === 'student'
                ? (string) ($resolvedStudentUsername ?? '')
                : null,
        ]);

        $roleIds = Role::whereIn('name', $assignedRoles)->pluck('id')->all();
        if (!empty($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        if ($validated['role'] === 'student') {
            $studentName = trim(implode(' ', array_filter([
                $validated['first_name'] ?? null,
                $validated['middle_name'] ?? null,
                $validated['last_name'] ?? null,
            ])));

            Student::create([
                'user_id' => $user->id,
                'student_name' => $studentName,
                'lrn' => (string) ($validated['lrn'] ?? ''),
                'parent_contact_number' => isset($validated['parent_contact_number'])
                    ? (trim((string) $validated['parent_contact_number']) ?: null)
                    : null,
            ] + $this->buildStudentSectionAttributes($selectedSection));

            return redirect()->route('superadmin.users.index')
                ->with('success', 'User created successfully.')
                ->with('created_student_credentials', [[
                    'id' => $user->id,
                    'first_name' => (string) ($validated['first_name'] ?? ''),
                    'middle_name' => (string) ($validated['middle_name'] ?? ''),
                    'last_name' => (string) ($validated['last_name'] ?? ''),
                    'full_name' => $studentName,
                    'lrn' => (string) ($validated['lrn'] ?? ''),
                    'username' => (string) ($user->username ?? ''),
                    'password' => (string) ($validated['password'] ?? ''),
                ]]);
        }

        try {
            Mail::to($user->email)->send(new TeacherCredentials(
                teacher: $user,
                plainPassword: (string) $teacherTempPassword,
                issuedBy: $superAdmin,
            ));
        } catch (\Throwable $exception) {
            report($exception);

            $user->roles()->detach();
            $user->delete();

            return back()->withErrors([
                'email' => 'Unable to send login credentials email. Please try again.',
            ]);
        }

        return redirect()->route('superadmin.users.index')
            ->with('success', 'Teacher created successfully. Login credentials were sent via email.');
    }

    private function buildStudentSectionAttributes(?Section $section): array
    {
        if (! $section) {
            return [];
        }

        return [
            'grade_level' => $section->grade_level,
            'section' => $section->section_name,
            'section_id' => (int) $section->id,
            'strand' => $section->strand,
            'track' => $section->track,
        ];
    }

    private function isValidStudentUsernameForName(string $username, string $firstName, string $lastName): bool
    {
        if (preg_match('/^[a-z]{2}\d{4}\d{5}$/', $username) !== 1) {
            return false;
        }

        $expectedPrefix = $this->buildStudentUsernamePrefix($firstName, $lastName);
        $expectedYear = now()->format('Y');

        return str_starts_with($username, $expectedPrefix . $expectedYear);
    }

    private function resolveNextStudentUsername(string $firstName, string $lastName): string
    {
        $prefix = $this->buildStudentUsernamePrefix($firstName, $lastName);
        $yearPart = now()->format('Y');
        $usernamePrefix = $prefix . $yearPart;
        $usernamePattern = '/^' . preg_quote($usernamePrefix, '/') . '\\d{5}$/';

        $latestMatching = User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'student');
            })
            ->where('username', 'like', $usernamePrefix . '%')
            ->orderByDesc('username')
            ->pluck('username')
            ->first(function ($value) use ($usernamePattern) {
                return is_string($value) && preg_match($usernamePattern, $value) === 1;
            });

        $nextSequence = 1;

        if (is_string($latestMatching) && preg_match('/(\d{5})$/', $latestMatching, $matches) === 1) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);

        while (User::query()->where('username', $candidate)->exists()) {
            $nextSequence++;
            $candidate = sprintf('%s%05d', $usernamePrefix, $nextSequence);
        }

        return $candidate;
    }

    private function buildStudentUsernamePrefix(string $firstName, string $lastName): string
    {
        $firstToken = $this->normalizeStudentUsernameToken($firstName, 'first');
        $lastToken = $this->normalizeStudentUsernameToken($lastName, 'last');

        $firstInitial = $firstToken !== '' ? substr($firstToken, 0, 1) : 'x';
        $lastInitial = $lastToken !== '' ? substr($lastToken, 0, 1) : 'x';

        return strtolower($firstInitial . $lastInitial);
    }

    private function normalizeStudentUsernameToken(string $value, string $mode = 'first'): string
    {
        $normalized = strtolower(trim(preg_replace('/[^a-z0-9\s]/i', ' ', $value) ?? ''));

        if ($normalized === '') {
            return '';
        }

        $tokens = preg_split('/\s+/', $normalized);

        if (! is_array($tokens) || empty($tokens)) {
            return '';
        }

        if ($mode === 'last') {
            return (string) ($tokens[count($tokens) - 1] ?? '');
        }

        return (string) ($tokens[0] ?? '');
    }

    public function destroy(Request $request, User $user)
    {
        $superAdminId = Auth::user();
        $request->validate([
            'password' => ['required'],
        ]);

        if (! Hash::check($request->password, $superAdminId->password)) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        $user->delete();

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', Rule::unique('users', 'personal_email')->ignore($user->id)],
            'password' => ['nullable', Password::min(8)],
            'role' => ['required', 'in:super_admin,admin,teacher,student'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'status' => ['required', 'in:active,inactive'],
            'parent_contact_number' => ['nullable', 'string', 'max:40'],
        ]);

        $currentRoles = $user->roles()->pluck('name');

        if ($currentRoles->contains('teacher') && $validated['role'] === 'student') {
            return back()->withErrors([
                'role' => 'Teachers cannot be changed to students.',
            ]);
        }

        if ($currentRoles->contains('student') && $validated['role'] === 'teacher') {
            return back()->withErrors([
                'role' => 'Students cannot be changed to teachers.',
            ]);
        }

        // Teachers must always be assigned to a department.
        if ($validated['role'] === 'teacher' && empty($validated['department_id'])) {
            return back()->withErrors([
                'department_id' => 'Department is required for teachers.',
            ]);
        }

        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->middle_name = $validated['middle_name'] ?? null;
        $user->personal_email = $validated['email'] ?? null;
        $user->status = $validated['status'];
        $user->department_id = $validated['role'] === 'teacher'
            ? $validated['department_id']
            : null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
            $user->must_change_password = true;
            $user->temporary_password = $validated['role'] === 'student'
                ? $validated['password']
                : null;
        }

        $user->save();

        $roleId = Role::where('name', $validated['role'])->value('id');
        if ($roleId) {
            $user->roles()->sync([$roleId]);
        }

        if ($validated['role'] === 'student') {
            $studentDisplayName = trim(implode(' ', array_filter([
                $validated['first_name'] ?? null,
                $validated['middle_name'] ?? null,
                $validated['last_name'] ?? null,
            ])));

            Student::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'student_name' => $studentDisplayName,
                    'parent_contact_number' => isset($validated['parent_contact_number'])
                        ? (trim((string) $validated['parent_contact_number']) ?: null)
                        : null,
                ],
            );
        }

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Generate a new temporary password and deliver it through email
     * or return student credentials for QR display.
     */
    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'delivery' => ['required', Rule::in(['email', 'qr'])],
        ]);

        $delivery = (string) $validated['delivery'];
        $isStudent = $user->hasRole('student');

        if (! $isStudent && $delivery === 'qr') {
            return back()->withErrors([
                'delivery' => 'QR credential delivery is only available for student accounts.',
            ]);
        }

        if ($delivery === 'email' && blank($user->email)) {
            return back()->withErrors([
                'email' => 'Cannot send temporary credentials because this account has no email address.',
            ]);
        }

        $tempPassword = $this->generateTemporaryPassword();

        $user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
            'password_changed_at' => null,
            'temporary_password' => $isStudent ? $tempPassword : null,
        ]);

        if ($delivery === 'email') {
            Mail::to($user->email)->send(new TemporaryCredentials(
                user: $user,
                plainPassword: $tempPassword,
                issuedBy: Auth::user(),
                context: 'password reset',
            ));
        }

        $successMessage = $delivery === 'email'
            ? 'Temporary credentials were sent via email.'
            : 'Temporary credentials generated. Share the QR code with the student.';

        $response = back()->with('success', $successMessage);

        if ($isStudent) {
            $user->loadMissing('student');

            $response = $response->with('password_reset_credentials', $this->buildResetCredentialPayload(
                $user,
                $tempPassword,
                $user->student,
            ));
        }

        return $response;
    }

    /**
     * Display teacher and student password reset requests.
     */
    public function passwordResetRequests(Request $request)
    {
        $status = $request->input('status', PasswordResetRequest::STATUS_PENDING);
        $studentLrn = trim((string) $request->input('student_lrn', ''));
        $allowedStatuses = [
            PasswordResetRequest::STATUS_PENDING,
            PasswordResetRequest::STATUS_APPROVED,
            PasswordResetRequest::STATUS_REJECTED,
            'all',
        ];

        if (!in_array($status, $allowedStatuses, true)) {
            $status = PasswordResetRequest::STATUS_PENDING;
        }

        $requestsQuery = $this->teacherAndStudentPasswordResetRequestsQuery()->with([
            'user.roles:id,name',
            'user.department:id,department_name',
            'processedBy',
        ]);

        if ($status !== 'all') {
            $requestsQuery->where('status', $status);
        }

        $requests = $requestsQuery
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $requests->getCollection()->transform(function (PasswordResetRequest $passwordResetRequest) {
            if ($passwordResetRequest->relationLoaded('user') && $passwordResetRequest->user) {
                $passwordResetRequest->user->setAttribute(
                    'role',
                    $passwordResetRequest->user->roles->pluck('name')->first()
                );
            }

            return $passwordResetRequest;
        });

        $counts = [
            'pending' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_PENDING)
                ->count(),
            'approved' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_APPROVED)
                ->count(),
            'rejected' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())
                ->where('status', PasswordResetRequest::STATUS_REJECTED)
                ->count(),
            'all' => (clone $this->teacherAndStudentPasswordResetRequestsQuery())->count(),
        ];

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();

        $studentsInCurrentTerm = Student::query()
            ->with([
                'user:id,first_name,middle_name,last_name,username,status,must_change_password',
            ])
            ->whereHas('user.roles', function ($roleQuery) {
                $roleQuery->where('name', 'student');
            })
            ->whereHas('user.enrollments.schoolClass', function ($classQuery) use ($currentSchoolYear, $currentSemester) {
                $classQuery
                    ->where('school_year', $currentSchoolYear)
                    ->where('semester', $currentSemester);
            })
            ->when($studentLrn !== '', function ($query) use ($studentLrn) {
                $query->where('lrn', 'like', "%{$studentLrn}%");
            })
            ->orderBy('student_name')
            ->paginate(10, ['*'], 'students_page')
            ->withQueryString();

        $studentsInCurrentTerm->getCollection()->transform(function (Student $student) {
            return [
                'id' => $student->id,
                'user_id' => $student->user_id,
                'student_name' => $student->student_name,
                'full_name' => $student->user?->name ?? $student->student_name,
                'lrn' => $student->lrn,
                'username' => $student->user?->username,
                'status' => $student->user?->status,
            ];
        });

        return Inertia::render('SuperAdmin/PasswordResetRequests', [
            'requests' => $requests,
            'counts' => $counts,
            'currentStatus' => $status,
            'studentsInCurrentTerm' => $studentsInCurrentTerm,
            'studentSearch' => [
                'lrn' => $studentLrn,
            ],
            'currentSchoolYear' => $currentSchoolYear,
            'currentSemester' => $currentSemester,
        ]);
    }

    /**
     * Approve a teacher/student password reset request.
     */
    public function approvePasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        if (!$this->canManagePasswordResetRequest($passwordResetRequest)) {
            abort(403, 'This password reset request is outside your allowed scope.');
        }

        if (!$passwordResetRequest->isPending()) {
            return back()->withErrors([
                'request' => 'This password reset request has already been processed.',
            ]);
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $tempPassword = $this->generateTemporaryPassword();

        $passwordResetRequest->user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
            'password_changed_at' => null,
            'temporary_password' => $passwordResetRequest->user->hasRole('student')
                ? $tempPassword
                : null,
        ]);

        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_APPROVED,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        return back()
            ->with('success', 'Password reset approved. Share the temporary credentials with the user.')
            ->with('password_reset_credentials', $this->buildResetCredentialPayload(
                $passwordResetRequest->user,
                $tempPassword,
                $passwordResetRequest->user->student,
            ));
    }

    /**
     * Reset a current-term student password by LRN.
     */
    public function resetStudentPasswordByLrn(Request $request)
    {
        $validated = $request->validate([
            'lrn' => ['required', 'string', 'size:12'],
        ]);

        $currentSchoolYear = SystemSetting::getCurrentSchoolYear();
        $currentSemester = (string) SystemSetting::getCurrentSemester();

        $student = Student::query()
            ->with('user.roles:id,name')
            ->where('lrn', trim((string) $validated['lrn']))
            ->whereHas('user.roles', function ($roleQuery) {
                $roleQuery->where('name', 'student');
            })
            ->whereHas('user.enrollments.schoolClass', function ($classQuery) use ($currentSchoolYear, $currentSemester) {
                $classQuery
                    ->where('school_year', $currentSchoolYear)
                    ->where('semester', $currentSemester);
            })
            ->first();

        if (!$student || !$student->user) {
            return back()->withErrors([
                'student_lrn' => 'No active student found for that LRN in the current school year and semester.',
            ]);
        }

        $tempPassword = $this->generateTemporaryPassword();

        $student->user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
            'password_changed_at' => null,
            'temporary_password' => $tempPassword,
        ]);

        return back()
            ->with('success', 'Student password reset successfully.')
            ->with('password_reset_credentials', $this->buildResetCredentialPayload(
                $student->user,
                $tempPassword,
                $student,
            ));
    }

    private function generateTemporaryPassword(int $length = 8): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $tempPassword = '';

        for ($i = 0; $i < $length; $i++) {
            $tempPassword .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return $tempPassword;
    }

    private function buildResetCredentialPayload(User $user, string $tempPassword, ?Student $student = null): array
    {
        $resolvedStudent = $student ?? $user->student;
        $loginIdentifier = (string) ($user->username ?: $user->email ?: '');

        return [
            'user_id' => $user->id,
            'full_name' => $user->name,
            'lrn' => $resolvedStudent?->lrn,
            'username' => $loginIdentifier,
            'password' => $tempPassword,
        ];
    }

    /**
     * Reject a teacher/student password reset request.
     */
    public function rejectPasswordResetRequest(Request $request, PasswordResetRequest $passwordResetRequest)
    {
        if (!$this->canManagePasswordResetRequest($passwordResetRequest)) {
            abort(403, 'This password reset request is outside your allowed scope.');
        }

        if (!$passwordResetRequest->isPending()) {
            return back()->withErrors([
                'request' => 'This password reset request has already been processed.',
            ]);
        }

        $validated = $request->validate([
            'admin_notes' => ['required', 'string', 'max:500'],
        ]);

        $passwordResetRequest->update([
            'status' => PasswordResetRequest::STATUS_REJECTED,
            'admin_notes' => $validated['admin_notes'],
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        return back()->with('success', 'Password reset request rejected.');
    }

    private function teacherAndStudentPasswordResetRequestsQuery()
    {
        return PasswordResetRequest::query()
            ->whereHas('user.roles', function ($roleQuery) {
                $roleQuery->whereIn('name', ['teacher', 'student']);
            });
    }

    private function canManagePasswordResetRequest(PasswordResetRequest $passwordResetRequest): bool
    {
        return $passwordResetRequest->user()
            ->whereHas('roles', function ($roleQuery) {
                $roleQuery->whereIn('name', ['teacher', 'student']);
            })
            ->exists();
    }
}

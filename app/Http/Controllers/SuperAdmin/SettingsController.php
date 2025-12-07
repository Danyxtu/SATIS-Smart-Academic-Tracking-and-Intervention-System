<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display system settings.
     */
    public function index(): Response
    {
        $settings = SystemSetting::all()->mapWithKeys(fn($s) => [$s->key => $s->value]);

        // Generate school year options (current year - 2 to current year + 2)
        $currentYear = (int) date('Y');
        $schoolYearOptions = [];
        for ($i = $currentYear - 2; $i <= $currentYear + 2; $i++) {
            $schoolYearOptions[] = "{$i}-" . ($i + 1);
        }

        return Inertia::render('SuperAdmin/Settings/Index', [
            'settings' => [
                'current_school_year' => $settings['current_school_year'] ?? date('Y') . '-' . (date('Y') + 1),
                'current_semester' => $settings['current_semester'] ?? '1',
                'enrollment_open' => filter_var($settings['enrollment_open'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'grade_submission_open' => filter_var($settings['grade_submission_open'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
                'school_name' => $settings['school_name'] ?? '',
                'school_address' => $settings['school_address'] ?? '',
            ],
            'schoolYears' => $schoolYearOptions,
        ]);
    }

    /**
     * Update academic settings.
     */
    public function updateAcademic(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'current_semester' => ['required', 'in:1,2'],
        ]);

        $userId = Auth::id();

        SystemSetting::updateOrCreate(
            ['key' => 'current_school_year'],
            [
                'value' => $validated['current_school_year'],
                'type' => 'string',
                'group' => 'academic',
                'description' => 'Current school year',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'current_semester'],
            [
                'value' => $validated['current_semester'],
                'type' => 'integer',
                'group' => 'academic',
                'description' => 'Current semester (1 or 2)',
                'updated_by' => $userId,
            ]
        );

        // Clear cache
        cache()->forget('system_setting_current_school_year');
        cache()->forget('system_setting_current_semester');

        return back()->with('success', 'Academic settings updated successfully.');
    }

    /**
     * Update enrollment settings.
     */
    public function updateEnrollment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enrollment_open' => ['required', 'boolean'],
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'enrollment_open'],
            [
                'value' => $validated['enrollment_open'] ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether enrollment is currently open',
                'updated_by' => Auth::id(),
            ]
        );

        cache()->forget('system_setting_enrollment_open');

        $status = $validated['enrollment_open'] ? 'opened' : 'closed';
        return back()->with('success', "Enrollment {$status} successfully.");
    }

    /**
     * Update grading settings.
     */
    public function updateGrading(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'grades_locked' => ['required', 'boolean'],
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'grades_locked'],
            [
                'value' => $validated['grades_locked'] ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether grade editing is locked',
                'updated_by' => Auth::id(),
            ]
        );

        cache()->forget('system_setting_grades_locked');

        $status = $validated['grades_locked'] ? 'locked' : 'unlocked';
        return back()->with('success', "Grades {$status} successfully.");
    }

    /**
     * Update school information.
     */
    public function updateSchoolInfo(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_address' => ['nullable', 'string', 'max:500'],
        ]);

        $userId = Auth::id();

        SystemSetting::updateOrCreate(
            ['key' => 'school_name'],
            [
                'value' => $validated['school_name'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School name',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'school_address'],
            [
                'value' => $validated['school_address'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School address',
                'updated_by' => $userId,
            ]
        );

        cache()->forget('system_setting_school_name');
        cache()->forget('system_setting_school_address');

        return back()->with('success', 'School information updated successfully.');
    }

    /**
     * Update all settings at once.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'current_semester' => ['required', 'in:1,2'],
            'enrollment_open' => ['boolean'],
            'grade_submission_open' => ['boolean'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'school_address' => ['nullable', 'string', 'max:500'],
        ]);

        $userId = Auth::id();

        // Academic settings
        SystemSetting::updateOrCreate(
            ['key' => 'current_school_year'],
            [
                'value' => $validated['current_school_year'],
                'type' => 'string',
                'group' => 'academic',
                'description' => 'Current school year',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'current_semester'],
            [
                'value' => $validated['current_semester'],
                'type' => 'integer',
                'group' => 'academic',
                'description' => 'Current semester (1 or 2)',
                'updated_by' => $userId,
            ]
        );

        // Enrollment settings
        SystemSetting::updateOrCreate(
            ['key' => 'enrollment_open'],
            [
                'value' => ($validated['enrollment_open'] ?? false) ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether enrollment is currently open',
                'updated_by' => $userId,
            ]
        );

        // Grading settings
        SystemSetting::updateOrCreate(
            ['key' => 'grade_submission_open'],
            [
                'value' => ($validated['grade_submission_open'] ?? false) ? 'true' : 'false',
                'type' => 'boolean',
                'group' => 'academic',
                'description' => 'Whether grade submission is open',
                'updated_by' => $userId,
            ]
        );

        // School info
        SystemSetting::updateOrCreate(
            ['key' => 'school_name'],
            [
                'value' => $validated['school_name'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School name',
                'updated_by' => $userId,
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'school_address'],
            [
                'value' => $validated['school_address'] ?? '',
                'type' => 'string',
                'group' => 'general',
                'description' => 'School address',
                'updated_by' => $userId,
            ]
        );

        // Clear all related cache
        cache()->forget('system_setting_current_school_year');
        cache()->forget('system_setting_current_semester');
        cache()->forget('system_setting_enrollment_open');
        cache()->forget('system_setting_grade_submission_open');
        cache()->forget('system_setting_school_name');
        cache()->forget('system_setting_school_address');

        return back()->with('success', 'Settings updated successfully.');
    }
}

<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubjectTeacher;
use App\Models\SystemSetting;
use App\Services\SuperAdmin\SchoolYearArchiveSnapshotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NewSchoolYearController extends Controller
{
    public function start(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'new_school_year' => [
                'required',
                'string',
                'regex:/^\d{4}-\d{4}$/',
            ],
            'confirm_school_year' => [
                'required',
                'string',
                'same:new_school_year',
            ],
        ], [
            'confirm_school_year.same' => 'The confirmation does not match the new school year.',
        ]);

        $newSY  = $validated['new_school_year'];
        $userId = Auth::id();

        // Prevent starting a SY that already has data
        $exists = SubjectTeacher::where('school_year', $newSY)->exists();
        if ($exists) {
            return back()->withErrors([
                'new_school_year' => "School year {$newSY} already has existing data.",
            ]);
        }

        DB::transaction(function () use ($newSY, $userId) {
            $currentSY = SystemSetting::getCurrentSchoolYear();

            app(SchoolYearArchiveSnapshotService::class)
                ->capture($currentSY, $newSY, $userId);

            // Update system settings for new SY (preserve historical records)
            $settings = [
                ['key' => 'current_school_year',   'value' => $newSY,   'type' => 'string',  'group' => 'academic', 'description' => 'Current school year'],
                ['key' => 'current_semester',       'value' => '1',      'type' => 'integer', 'group' => 'academic', 'description' => 'Current semester'],
                ['key' => 'enrollment_open',        'value' => 'false',  'type' => 'boolean', 'group' => 'academic', 'description' => 'Whether enrollment is open'],
                ['key' => 'grade_submission_open',  'value' => 'false',  'type' => 'boolean', 'group' => 'academic', 'description' => 'Whether grade submission is open'],
            ];

            foreach ($settings as $s) {
                SystemSetting::updateOrCreate(
                    ['key' => $s['key']],
                    array_merge($s, ['updated_by' => $userId])
                );
                cache()->forget("system_setting_{$s['key']}");
            }
        });

        return redirect()->route('superadmin.settings.index')
            ->with('success', "New school year {$newSY} has started. Previous records were archived and preserved.");
    }
}

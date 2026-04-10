<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Teacher\WatchlistSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassSettingsController extends Controller
{
    public function __construct(private WatchlistSettingsService $watchlistSettingsService) {}

    public function index(Request $request): Response
    {
        $teacher = $request->user();

        return Inertia::render('Teacher/ClassSettings', [
            'settings' => $this->watchlistSettingsService->getForTeacher($teacher),
            'globalRules' => $this->watchlistSettingsService->getGlobalRuleSnapshot(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Keep these as required-only to allow FormData boolean strings
            // (e.g. "true", "false", "on") from different clients.
            'observe.at_risk' => ['required'],
            'observe.needs_attention' => ['required'],
            'observe.recent_decline' => ['required'],
            'needs_attention.absence_threshold' => ['required', 'numeric', 'min:1', 'max:15'],
            'needs_attention.failing_activities_threshold' => ['required', 'numeric', 'min:1', 'max:20'],
            // Support both new and legacy keys to avoid breaking stale clients.
            'recent_decline.minimum_drop_percent' => ['nullable', 'numeric', 'min:1', 'max:60'],
            'recent_decline.minimum_drop_points' => ['nullable', 'numeric', 'min:1', 'max:60'],
        ]);

        $defaultMinimumDropPercent = (float) data_get(
            config('watchlist', []),
            'recent_decline.minimum_drop_percent',
            20.0,
        );

        $minimumDropPercent = (float) (
            data_get($validated, 'recent_decline.minimum_drop_percent')
            ?? data_get($validated, 'recent_decline.minimum_drop_points')
            ?? $defaultMinimumDropPercent
        );

        $this->watchlistSettingsService->saveForTeacher(
            $request->user(),
            [
                'observe' => data_get($validated, 'observe', []),
                'needs_attention' => data_get($validated, 'needs_attention', []),
                'recent_decline' => [
                    'minimum_drop_percent' => $minimumDropPercent,
                ],
            ],
        );

        return back()->with('success', 'Class settings updated.');
    }
}

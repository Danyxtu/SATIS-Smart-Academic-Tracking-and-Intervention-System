<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherRegistration;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TeacherRegistrationController extends Controller
{
    /**
     * Display the list of pending teacher registrations.
     */
    public function index(): Response
    {
        $admin = Auth::user();

        $registrations = TeacherRegistration::with('department')
            ->forDepartment($admin->department_id)
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($registration) {
                return [
                    'id' => $registration->id,
                    'first_name' => $registration->first_name,
                    'last_name' => $registration->last_name,
                    'full_name' => $registration->full_name,
                    'email' => $registration->email,
                    'department' => $registration->department ? [
                        'id' => $registration->department->id,
                        'name' => $registration->department->name,
                        'code' => $registration->department->code,
                    ] : null,
                    'document_url' => $registration->document_path
                        ? Storage::url($registration->document_path)
                        : null,
                    'status' => $registration->status,
                    'created_at' => $registration->created_at->format('M d, Y h:i A'),
                ];
            });

        // Get count for badge
        $pendingCount = $registrations->count();

        return Inertia::render('Admin/TeacherRegistrations/Index', [
            'registrations' => $registrations,
            'pendingCount' => $pendingCount,
        ]);
    }

    /**
     * Approve a teacher registration.
     */
    public function approve(TeacherRegistration $registration): RedirectResponse
    {
        $admin = Auth::user();

        // Ensure the registration belongs to admin's department
        if ($registration->department_id !== $admin->department_id) {
            abort(403, 'You can only approve registrations for your department.');
        }

        // Ensure registration is pending
        if (!$registration->isPending()) {
            return back()->with('error', 'This registration has already been processed.');
        }

        // Create the user account
        $user = User::create([
            'name' => $registration->full_name,
            'email' => $registration->email,
            'password' => $registration->password, // Already hashed
            'role' => 'teacher',
            'department_id' => $registration->department_id,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        // Update registration status
        $registration->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', "Teacher account for {$registration->full_name} has been approved and created successfully.");
    }

    /**
     * Reject a teacher registration.
     */
    public function reject(Request $request, TeacherRegistration $registration): RedirectResponse
    {
        $admin = Auth::user();

        // Ensure the registration belongs to admin's department
        if ($registration->department_id !== $admin->department_id) {
            abort(403, 'You can only reject registrations for your department.');
        }

        // Ensure registration is pending
        if (!$registration->isPending()) {
            return back()->with('error', 'This registration has already been processed.');
        }

        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        // Delete the uploaded document
        if ($registration->document_path) {
            Storage::disk('public')->delete($registration->document_path);
        }

        // Update registration status
        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', "Registration for {$registration->full_name} has been rejected.");
    }

    /**
     * Download the registration document.
     */
    public function downloadDocument(TeacherRegistration $registration)
    {
        $admin = Auth::user();

        // Ensure the registration belongs to admin's department
        if ($registration->department_id !== $admin->department_id) {
            abort(403, 'You can only view documents for your department.');
        }

        if (!$registration->document_path || !Storage::disk('public')->exists($registration->document_path)) {
            abort(404, 'Document not found.');
        }

        $filePath = Storage::disk('public')->path($registration->document_path);
        $fileName = "registration_document_{$registration->id}." . pathinfo($registration->document_path, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}

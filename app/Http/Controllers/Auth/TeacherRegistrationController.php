<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\TeacherRegistration;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class TeacherRegistrationController extends Controller
{
    /**
     * Display the teacher registration form.
     */
    public function create(): Response
    {
        $departments = Department::where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Auth/TeacherRegister', [
            'departments' => $departments,
        ]);
    }

    /**
     * Handle an incoming teacher registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email|unique:teacher_registrations,email',
            'department_id' => 'required|exists:departments,id',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'document' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB max
        ]);

        // Store the uploaded document
        $documentPath = null;
        if ($request->hasFile('document')) {
            $documentPath = $request->file('document')->store('teacher-registrations', 'public');
        }

        // Create the registration record
        TeacherRegistration::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'department_id' => $request->department_id,
            'password' => Hash::make($request->password),
            'document_path' => $documentPath,
            'status' => 'pending',
        ]);

        return redirect()->route('teacher.registration.success');
    }

    /**
     * Display registration success page.
     */
    public function success(): Response
    {
        return Inertia::render('Auth/TeacherRegisterSuccess');
    }
}

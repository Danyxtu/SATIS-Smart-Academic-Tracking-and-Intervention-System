<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_year_archives', function (Blueprint $table): void {
            $table->id();
            $table->string('archive_key', 96)->unique();
            $table->string('school_year', 32)->unique();
            $table->string('next_school_year', 32)->nullable();
            $table->timestamp('captured_at')->useCurrent()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('archive_users', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->unsignedBigInteger('original_user_id')->nullable()->index();
            $table->string('first_name', 120)->nullable();
            $table->string('middle_name', 120)->nullable();
            $table->string('last_name', 120)->nullable();
            $table->string('username', 64)->nullable();
            $table->string('personal_email')->nullable();
            $table->string('status', 32)->nullable();
            $table->string('primary_role', 50)->nullable();
            $table->json('roles_json')->nullable();
            $table->string('department_name')->nullable();
            $table->string('department_code', 64)->nullable();
            $table->string('department_track', 32)->nullable();
            $table->timestamps();

            $table->index(['school_year_archive_id', 'primary_role']);
            $table->index(['school_year_archive_id', 'department_code']);
            $table->index(['school_year_archive_id', 'username']);
        });

        Schema::create('archive_departments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->unsignedBigInteger('original_department_id')->nullable()->index();
            $table->string('department_name');
            $table->string('department_code', 64)->nullable();
            $table->string('track', 32)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('specializations_json')->nullable();
            $table->json('admins_json')->nullable();
            $table->json('teachers_json')->nullable();
            $table->timestamps();

            $table->index(['school_year_archive_id', 'track']);
            $table->index(['school_year_archive_id', 'department_code']);
        });

        Schema::create('archive_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->unsignedBigInteger('original_section_id')->nullable()->index();
            $table->unsignedBigInteger('original_department_id')->nullable()->index();
            $table->string('section_name');
            $table->string('section_code', 80)->nullable();
            $table->string('grade_level', 32)->nullable();
            $table->string('strand', 120)->nullable();
            $table->string('track', 32)->nullable();
            $table->string('school_year', 32)->nullable();
            $table->string('advisor_name')->nullable();
            $table->string('department_name')->nullable();
            $table->string('department_code', 64)->nullable();
            $table->timestamps();

            $table->index(['school_year_archive_id', 'grade_level']);
            $table->index(['school_year_archive_id', 'section_name']);
            $table->index(['school_year_archive_id', 'strand']);
            $table->index(['school_year_archive_id', 'track']);
        });

        Schema::create('archive_classes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->unsignedBigInteger('original_class_id')->nullable()->index();
            $table->unsignedBigInteger('original_subject_id')->nullable()->index();
            $table->unsignedBigInteger('archive_section_id')->nullable()->index();
            $table->unsignedBigInteger('teacher_user_id')->nullable()->index();
            $table->string('subject_name')->nullable();
            $table->string('subject_code', 64)->nullable();
            $table->string('grade_level', 32)->nullable();
            $table->string('section_name')->nullable();
            $table->string('section_code', 80)->nullable();
            $table->string('strand', 120)->nullable();
            $table->string('track', 32)->nullable();
            $table->string('school_year', 32)->nullable();
            $table->unsignedTinyInteger('semester')->nullable();
            $table->unsignedTinyInteger('current_quarter')->nullable();
            $table->string('color', 32)->nullable();
            $table->string('teacher_name')->nullable();
            $table->string('teacher_department_name')->nullable();
            $table->string('teacher_department_code', 64)->nullable();
            $table->json('grade_categories')->nullable();
            $table->unsignedInteger('students_total')->default(0);
            $table->timestamps();

            $table->index(['school_year_archive_id', 'semester']);
            $table->index(['school_year_archive_id', 'grade_level']);
            $table->index(['school_year_archive_id', 'track']);
            $table->index(['school_year_archive_id', 'section_name']);
            $table->index(['school_year_archive_id', 'teacher_name']);
        });

        Schema::create('archive_enrollments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->foreignId('archive_class_id')->constrained('archive_classes')->cascadeOnDelete();
            $table->unsignedBigInteger('original_enrollment_id')->nullable()->index();
            $table->unsignedBigInteger('student_user_id')->nullable()->index();
            $table->string('student_name');
            $table->string('student_username', 64)->nullable();
            $table->string('student_lrn', 32)->nullable();
            $table->string('grade_level', 32)->nullable();
            $table->string('section_name')->nullable();
            $table->string('strand', 120)->nullable();
            $table->string('track', 32)->nullable();
            $table->decimal('initial_grade_q1', 5, 2)->nullable();
            $table->decimal('expected_grade_q1', 5, 2)->nullable();
            $table->unsignedTinyInteger('q1_grade')->nullable();
            $table->decimal('initial_grade_q2', 5, 2)->nullable();
            $table->decimal('expected_grade_q2', 5, 2)->nullable();
            $table->unsignedTinyInteger('q2_grade')->nullable();
            $table->unsignedTinyInteger('final_grade')->nullable();
            $table->string('remarks', 32)->nullable();
            $table->boolean('passed')->nullable();
            $table->timestamps();

            $table->index(['school_year_archive_id', 'grade_level']);
            $table->index(['school_year_archive_id', 'section_name']);
            $table->index(['school_year_archive_id', 'strand']);
            $table->index(['school_year_archive_id', 'student_name']);
        });

        Schema::create('archive_grade_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_year_archive_id')->constrained('school_year_archives')->cascadeOnDelete();
            $table->foreignId('archive_class_id')->constrained('archive_classes')->cascadeOnDelete();
            $table->foreignId('archive_enrollment_id')->constrained('archive_enrollments')->cascadeOnDelete();
            $table->unsignedTinyInteger('quarter')->nullable();
            $table->string('category_id', 120)->nullable();
            $table->string('category_label')->nullable();
            $table->decimal('category_weight', 6, 2)->nullable();
            $table->string('task_id', 120)->nullable();
            $table->string('task_label')->nullable();
            $table->string('assignment_key', 120)->nullable();
            $table->string('assignment_name')->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->decimal('total_score', 8, 2)->nullable();
            $table->decimal('percentage', 6, 2)->nullable();
            $table->timestamps();

            $table->index(['school_year_archive_id', 'quarter']);
            $table->index(['archive_class_id', 'quarter']);
            $table->index(['archive_enrollment_id', 'quarter']);
            $table->index(['school_year_archive_id', 'category_label']);
            $table->index(['school_year_archive_id', 'task_label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archive_grade_items');
        Schema::dropIfExists('archive_enrollments');
        Schema::dropIfExists('archive_classes');
        Schema::dropIfExists('archive_sections');
        Schema::dropIfExists('archive_departments');
        Schema::dropIfExists('archive_users');
        Schema::dropIfExists('school_year_archives');
    }
};

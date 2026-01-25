<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->onDelete('cascade'); // Links to the Student+Subject
            $table->string('assignment_name'); // e.g., "Quiz 1", "Midterm"
            $table->float('score');
            $table->float('total_score');
            $table->integer('quarter');
            $table->timestamps();
            if (! Schema::hasColumn('grades', 'assignment_key')) {
                $table->string('assignment_key')->nullable()->after('assignment_name');
            }

            $table->unique(['enrollment_id', 'assignment_key', 'quarter'], 'grades_assignment_unique');
        });

        DB::table('grades')
            ->select('id', 'assignment_name')
            ->orderBy('id')
            ->chunkById(500, function ($grades) {
                foreach ($grades as $grade) {
                    DB::table('grades')
                        ->where('id', $grade->id)
                        ->update([
                            'assignment_key' => Str::slug($grade->assignment_name ?? 'assignment', '_'),
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};

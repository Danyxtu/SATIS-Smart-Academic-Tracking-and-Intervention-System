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
            $table->string('assignment_key')->nullable()->after('assignment_name');
            $table->unique(['enrollment_id', 'assignment_key', 'quarter'], 'grades_assignment_unique');
            $table->timestamps();
        });

        /**
         * There's Nothing to populate for now since the 'assignment_key' is a new field and will be generated based on the 'assignment_name' when creating or updating grades in the application logic. However, if you have existing data and want to backfill the 'assignment_key' for those records, you can use the following code snippet. This will generate a slug from the 'assignment_name' and update the 'assignment_key' for each record in the 'grades' table.
         */
        // DB::table('grades')
        //     ->select('id', 'assignment_name')
        //     ->orderBy('id')
        //     ->chunkById(500, function ($grades) {
        //         foreach ($grades as $grade) {
        //             DB::table('grades')
        //                 ->where('id', $grade->id)
        //                 ->update([
        //                     'assignment_key' => Str::slug($grade->assignment_name ?? 'assignment', '_'),
        //                 ]);
        //         }
        //     });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};

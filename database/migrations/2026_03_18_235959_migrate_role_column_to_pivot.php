<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // Sync any existing role column data to the pivot table
        $users = DB::table('users')->whereNotNull('role')->get(['id', 'role']);
        
        foreach ($users as $user) {
            $role = Role::where('name', $user->role)->first();
            
            if ($role) {
                // Check if relationship already exists
                $exists = DB::table('role_user')
                    ->where('user_id', $user->id)
                    ->where('role_id', $role->id)
                    ->exists();
                
                if (!$exists) {
                    DB::table('role_user')->insert([
                        'user_id' => $user->id,
                        'role_id' => $role->id,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // Restore role column data from pivot table
        $roleUsers = DB::table('role_user')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->select('role_user.user_id', 'roles.name')
            ->get();
        
        foreach ($roleUsers as $roleUser) {
            DB::table('users')
                ->where('id', $roleUser->user_id)
                ->update(['role' => $roleUser->name]);
        }
    }
};

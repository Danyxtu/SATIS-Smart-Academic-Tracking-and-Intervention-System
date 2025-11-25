<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use function Pest\Laravel\json;

Route::get('/test', function () {
    return response()->json([
        'message' => 'Hello from Laravel!',
        'status' => 'success'
    ]);
});


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now(),
    ]);
});

Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('user', function (Request $req) {
    return $req->user();
});

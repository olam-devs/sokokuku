<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FarmerController;
use App\Http\Controllers\SurveyController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Field agent routes
    Route::post('/surveys', [SurveyController::class, 'store']);
    Route::post('/surveys/batch', [SurveyController::class, 'syncBatch']);
    Route::post('/farmers', [FarmerController::class, 'store']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/businesses', [DashboardController::class, 'businesses']);
        Route::get('/dashboard/map', [DashboardController::class, 'mapPoints']);
        Route::get('/dashboard/agents', [DashboardController::class, 'agents']);
        Route::post('/dashboard/agents', [DashboardController::class, 'createAgent']);
        Route::get('/dashboard/farmers', [FarmerController::class, 'index']);
        Route::get('/dashboard/farmers/map', [FarmerController::class, 'mapPoints']);
    });
});

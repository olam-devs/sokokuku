<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('field_agent_id')->constrained('users')->cascadeOnDelete();
            $table->enum('interested_in_supply', ['yes', 'maybe', 'no']);
            $table->boolean('marketing_permission')->default(false);
            $table->text('notes')->nullable();
            $table->uuid('offline_uuid')->unique();
            $table->timestamp('visited_at');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_visits');
    }
};

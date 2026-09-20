<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farmers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 20);
            $table->string('address')->nullable();
            $table->string('area');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('gps_accuracy', 8, 2)->nullable();
            $table->timestamp('gps_captured_at')->nullable();
            $table->string('place_name')->nullable();
            $table->string('ward')->nullable();
            $table->string('district')->nullable();
            $table->boolean('can_deliver')->default(false);
            $table->boolean('can_collect')->default(false);
            $table->text('notes')->nullable();
            $table->foreignId('field_agent_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farmers');
    }
};

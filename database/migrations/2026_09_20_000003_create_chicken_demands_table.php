<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chicken_demands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->boolean('buys_chicken')->default(false);
            $table->unsignedInteger('birds_per_week')->nullable();
            $table->unsignedInteger('price_per_bird')->nullable();
            $table->decimal('preferred_weight_kg', 4, 1)->nullable();
            $table->string('frequency', 80)->nullable();
            $table->string('current_supplier')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chicken_demands');
    }
};

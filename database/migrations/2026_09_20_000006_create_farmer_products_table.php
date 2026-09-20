<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farmer_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')->constrained()->cascadeOnDelete();
            $table->enum('product_type', ['egg', 'chicken']);
            // Eggs
            $table->unsignedInteger('egg_trays_per_week')->nullable();
            $table->unsignedInteger('egg_price_per_tray')->nullable();
            // Chickens
            $table->unsignedInteger('chicken_birds_per_week')->nullable();
            $table->unsignedInteger('chicken_price_per_bird')->nullable();
            $table->decimal('chicken_avg_weight_kg', 4, 1)->nullable();
            // Common
            $table->unsignedInteger('current_stock')->nullable();
            $table->date('next_harvest_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farmer_products');
    }
};

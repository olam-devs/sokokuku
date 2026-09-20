<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('egg_demands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->boolean('buys_eggs')->default(false);
            $table->unsignedInteger('trays_per_purchase')->nullable();
            $table->string('frequency', 80)->nullable();
            $table->unsignedInteger('price_per_tray')->nullable();
            $table->string('grade')->nullable();
            $table->string('current_supplier')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('egg_demands');
    }
};

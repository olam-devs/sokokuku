<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FarmerProduct extends Model
{
    protected $fillable = [
        'farmer_id', 'product_type',
        'egg_trays_per_week', 'egg_price_per_tray',
        'chicken_birds_per_week', 'chicken_price_per_bird', 'chicken_avg_weight_kg',
        'current_stock', 'next_harvest_date',
    ];

    protected $casts = [
        'next_harvest_date' => 'date',
        'chicken_avg_weight_kg' => 'float',
    ];

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(Farmer::class);
    }
}

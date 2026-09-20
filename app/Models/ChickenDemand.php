<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChickenDemand extends Model
{
    protected $fillable = [
        'business_id', 'buys_chicken', 'birds_per_week',
        'price_per_bird', 'preferred_weight_kg', 'frequency', 'current_supplier',
    ];

    protected $casts = [
        'buys_chicken' => 'boolean',
        'preferred_weight_kg' => 'float',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}

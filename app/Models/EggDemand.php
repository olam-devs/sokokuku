<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EggDemand extends Model
{
    protected $fillable = [
        'business_id', 'buys_eggs', 'trays_per_purchase',
        'frequency', 'price_per_tray', 'grade', 'current_supplier',
    ];

    protected $casts = [
        'buys_eggs' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function weeklyTrays(): ?float
    {
        if (! $this->buys_eggs || ! $this->trays_per_purchase) {
            return null;
        }

        return match ($this->frequency) {
            'daily'       => $this->trays_per_purchase * 7,
            '2-3_per_week' => $this->trays_per_purchase * 2.5,
            'weekly'      => $this->trays_per_purchase,
            default       => null,
        };
    }
}

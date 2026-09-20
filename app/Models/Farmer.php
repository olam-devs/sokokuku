<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farmer extends Model
{
    protected $fillable = [
        'name', 'phone', 'address', 'area',
        'latitude', 'longitude', 'gps_accuracy', 'gps_captured_at',
        'place_name', 'ward', 'district',
        'can_deliver', 'can_collect', 'notes', 'field_agent_id',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'gps_accuracy' => 'float',
        'gps_captured_at' => 'datetime',
        'can_deliver' => 'boolean',
        'can_collect' => 'boolean',
    ];

    public function fieldAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_agent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(FarmerProduct::class);
    }
}

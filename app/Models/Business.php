<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Business extends Model
{
    protected $fillable = [
        'name', 'type', 'contact_person', 'contact_phone',
        'address', 'area', 'latitude', 'longitude',
        'gps_accuracy', 'gps_captured_at',
        'place_name', 'ward', 'district',
        'field_agent_id',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'gps_accuracy' => 'float',
        'gps_captured_at' => 'datetime',
    ];

    public function fieldAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_agent_id');
    }

    public function eggDemand(): HasOne
    {
        return $this->hasOne(EggDemand::class);
    }

    public function chickenDemand(): HasOne
    {
        return $this->hasOne(ChickenDemand::class);
    }

    public function surveyVisits(): HasMany
    {
        return $this->hasMany(SurveyVisit::class);
    }

    public function latestVisit(): HasOne
    {
        return $this->hasOne(SurveyVisit::class)->latestOfMany();
    }
}

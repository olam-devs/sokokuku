<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyVisit extends Model
{
    protected $fillable = [
        'business_id', 'field_agent_id', 'interested_in_supply',
        'marketing_permission', 'notes', 'offline_uuid', 'visited_at', 'synced_at',
    ];

    protected $casts = [
        'marketing_permission' => 'boolean',
        'visited_at' => 'datetime',
        'synced_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function fieldAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'field_agent_id');
    }
}

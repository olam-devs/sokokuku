<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\SurveyVisit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveyController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'offline_uuid' => 'required|uuid',
            'visited_at' => 'required|date',
            'business.name' => 'required|string|max:255',
            'business.type' => 'required|in:hotel,restaurant,shop,supermarket,institution,other',
            'business.contact_person' => 'nullable|string|max:255',
            'business.contact_phone' => 'nullable|string|max:20',
            'business.address' => 'nullable|string|max:255',
            'business.area' => 'required|string|max:255',
            'business.latitude' => 'nullable|numeric|between:-90,90',
            'business.longitude' => 'nullable|numeric|between:-180,180',
            'business.gps_accuracy' => 'nullable|numeric',
            'business.gps_captured_at' => 'nullable|date',
            'business.place_name' => 'nullable|string|max:255',
            'business.ward' => 'nullable|string|max:100',
            'business.district' => 'nullable|string|max:100',
            'egg.buys_eggs' => 'required|boolean',
            'egg.trays_per_purchase' => 'nullable|integer|min:1',
            'egg.frequency' => 'nullable|string|max:80',
            'egg.price_per_tray' => 'nullable|integer|min:0',
            'egg.grade' => 'nullable|string|max:50',
            'egg.current_supplier' => 'nullable|string|max:255',
            'chicken.buys_chicken' => 'required|boolean',
            'chicken.birds_per_week' => 'nullable|integer|min:1',
            'chicken.price_per_bird' => 'nullable|integer|min:0',
            'chicken.preferred_weight_kg' => 'nullable|numeric|min:0',
            'chicken.frequency' => 'nullable|string|max:80',
            'chicken.current_supplier' => 'nullable|string|max:255',
            'interested_in_supply' => 'required|in:yes,maybe,no',
            'marketing_permission' => 'required|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Deduplicate by offline_uuid so syncing twice is safe
        if (SurveyVisit::where('offline_uuid', $data['offline_uuid'])->exists()) {
            return response()->json(['message' => 'Already synced'], 200);
        }

        DB::transaction(function () use ($data, $request) {
            $business = Business::create([
                ...$data['business'],
                'field_agent_id' => $request->user()->id,
            ]);

            $business->eggDemand()->create($data['egg']);
            $business->chickenDemand()->create($data['chicken']);

            SurveyVisit::create([
                'business_id' => $business->id,
                'field_agent_id' => $request->user()->id,
                'interested_in_supply' => $data['interested_in_supply'],
                'marketing_permission' => $data['marketing_permission'],
                'notes' => $data['notes'] ?? null,
                'offline_uuid' => $data['offline_uuid'],
                'visited_at' => $data['visited_at'],
                'synced_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Survey synced'], 201);
    }

    public function syncBatch(Request $request): JsonResponse
    {
        $request->validate([
            'surveys' => 'required|array|max:50',
        ]);

        $results = [];
        foreach ($request->surveys as $survey) {
            try {
                $fakeRequest = Request::create('/', 'POST', $survey);
                $fakeRequest->setUserResolver(fn () => $request->user());
                $response = $this->store($fakeRequest);
                $results[] = ['uuid' => $survey['offline_uuid'], 'status' => $response->getStatusCode()];
            } catch (\Exception $e) {
                $results[] = ['uuid' => $survey['offline_uuid'] ?? null, 'status' => 422, 'error' => $e->getMessage()];
            }
        }

        return response()->json(['results' => $results]);
    }
}

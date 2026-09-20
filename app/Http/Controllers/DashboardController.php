<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\SurveyVisit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalBusinesses = Business::count();
        $byType = Business::select('type', DB::raw('count(*) as count'))->groupBy('type')->pluck('count', 'type');
        $eggBuyers = DB::table('egg_demands')->where('buys_eggs', true)->count();
        $chickenBuyers = DB::table('chicken_demands')->where('buys_chicken', true)->count();
        $totalEggTrays = DB::table('egg_demands')->where('buys_eggs', true)->sum('trays_per_purchase');
        $totalChickenBirds = DB::table('chicken_demands')->where('buys_chicken', true)->sum('birds_per_week');
        $interestedProspects = SurveyVisit::whereIn('interested_in_supply', ['yes', 'maybe'])->count();
        $recentVisits = SurveyVisit::with('business', 'fieldAgent')
            ->orderByDesc('visited_at')
            ->limit(10)
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'business_name' => $v->business->name,
                'area' => $v->business->area,
                'agent_name' => $v->fieldAgent->name,
                'visited_at' => $v->visited_at,
                'interested_in_supply' => $v->interested_in_supply,
            ]);

        return response()->json([
            'total_businesses' => $totalBusinesses,
            'by_type' => $byType,
            'egg_buyers' => $eggBuyers,
            'chicken_buyers' => $chickenBuyers,
            'total_egg_trays_per_purchase' => $totalEggTrays,
            'total_chicken_birds_per_week' => $totalChickenBirds,
            'interested_prospects' => $interestedProspects,
            'recent_visits' => $recentVisits,
        ]);
    }

    public function businesses(Request $request): JsonResponse
    {
        $query = Business::with('eggDemand', 'chickenDemand', 'latestVisit', 'fieldAgent')
            ->orderByDesc('created_at');

        if ($request->area) {
            $query->where('area', 'like', '%'.$request->area.'%');
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->product === 'egg') {
            $query->whereHas('eggDemand', fn ($q) => $q->where('buys_eggs', true));
        }
        if ($request->product === 'chicken') {
            $query->whereHas('chickenDemand', fn ($q) => $q->where('buys_chicken', true));
        }
        if ($request->interest) {
            $query->whereHas('latestVisit', fn ($q) => $q->where('interested_in_supply', $request->interest));
        }

        $businesses = $query->paginate(50);

        return response()->json($businesses);
    }

    public function mapPoints(): JsonResponse
    {
        $points = Business::with('latestVisit')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'type' => $b->type,
                'area' => $b->area,
                'lat' => $b->latitude,
                'lng' => $b->longitude,
                'interested_in_supply' => $b->latestVisit?->interested_in_supply,
            ]);

        return response()->json($points);
    }

    public function agents(): JsonResponse
    {
        $agents = User::where('role', 'field_agent')
            ->withCount('businesses', 'surveyVisits')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'active' => $u->active,
                'businesses_count' => $u->businesses_count,
                'survey_visits_count' => $u->survey_visits_count,
            ]);

        return response()->json($agents);
    }

    public function createAgent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
        ]);

        $agent = User::create([
            ...$data,
            'role' => 'field_agent',
            'active' => true,
        ]);

        return response()->json(['id' => $agent->id, 'name' => $agent->name], 201);
    }
}

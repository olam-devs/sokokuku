<?php

namespace App\Http\Controllers;

use App\Models\Farmer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FarmerController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'area' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'gps_accuracy' => 'nullable|numeric',
            'gps_captured_at' => 'nullable|date',
            'place_name' => 'nullable|string|max:255',
            'ward' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'can_deliver' => 'boolean',
            'can_collect' => 'boolean',
            'notes' => 'nullable|string|max:1000',
            'products' => 'required|array|min:1',
            'products.*.product_type' => 'required|in:egg,chicken',
            'products.*.egg_trays_per_week' => 'nullable|integer|min:0',
            'products.*.egg_price_per_tray' => 'nullable|integer|min:0',
            'products.*.chicken_birds_per_week' => 'nullable|integer|min:0',
            'products.*.chicken_price_per_bird' => 'nullable|integer|min:0',
            'products.*.chicken_avg_weight_kg' => 'nullable|numeric|min:0',
            'products.*.current_stock' => 'nullable|integer|min:0',
            'products.*.next_harvest_date' => 'nullable|date',
        ]);

        $farmer = DB::transaction(function () use ($data, $request) {
            $farmer = Farmer::create([
                ...$data,
                'field_agent_id' => $request->user()->id,
            ]);
            foreach ($data['products'] as $product) {
                $farmer->products()->create($product);
            }
            return $farmer;
        });

        return response()->json(['id' => $farmer->id, 'name' => $farmer->name], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Farmer::with('products', 'fieldAgent')->orderByDesc('created_at');

        if ($request->area) {
            $query->where('area', 'like', '%'.$request->area.'%');
        }
        if ($request->district) {
            $query->where('district', 'like', '%'.$request->district.'%');
        }
        if ($request->product) {
            $query->whereHas('products', fn ($q) => $q->where('product_type', $request->product));
        }

        return response()->json($query->paginate(50));
    }

    public function mapPoints(): JsonResponse
    {
        $points = Farmer::with('products')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'area' => $f->area,
                'district' => $f->district,
                'lat' => $f->latitude,
                'lng' => $f->longitude,
                'products' => $f->products->pluck('product_type'),
            ]);

        return response()->json($points);
    }
}

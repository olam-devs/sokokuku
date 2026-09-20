<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@sokokuku.co.tz'],
            [
                'name' => 'Admin',
                'role' => 'admin',
                'active' => true,
                'password' => Hash::make('admin1234'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'agent@sokokuku.co.tz'],
            [
                'name' => 'Test Agent',
                'role' => 'field_agent',
                'active' => true,
                'password' => Hash::make('agent1234'),
            ]
        );
    }
}

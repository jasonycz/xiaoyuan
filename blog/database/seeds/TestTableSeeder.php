<?php
use Illuminate\Database\Seeder;
use App\Models\Test;
class TestTableSeeder extends Seeder {

    public function run()
    {
        DB::table('test')->delete();
        Test::create(['test_email' => 'foo@bar.com']);
    }

}
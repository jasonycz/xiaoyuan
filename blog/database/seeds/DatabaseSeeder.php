<?php

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {   
        // 有两种方案
        // $this->call(UsersTableSeeder::class);
        $this->call('PageTableSeeder');
        // $this->call('TestTableSeeder');
    }
}

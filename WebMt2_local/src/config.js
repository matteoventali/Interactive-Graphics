// Global parameters of the game

// Envinronment ang graphics config
export var random_spawn = false;
export var show_vegetations = true;
export var show_metin = true;
export var show_shadows = false;
export var show_tent = true;
export var show_monsters = true;
export var change_level_duration = 3;

// Level config
export var game_over_active = false;
export var current_level = 1;
export var metin_life_additive_term = 250;
export var metin_life_coefficient = 150;
export var metin_def_additive_term = 5;
export var metin_def_coefficient = 2;
export var probability_key = 0.2;
export var number_tree = 50;
export var number_metin = 15;

// Monster config
export var monster_type_guardian = 2;
export var monster_type_hunter = 1;
export var monster_life = 10;
export var number_hunter_per_metin = 1;  
export var number_guardian_per_metin = 3;
export var treshold_distance_follow_monster = 10;
export var treshold_distance_near_monster = 5;
export var monster_scale_default = 1;
export var baseEnemyDamage = 5;
export var enemyDamagePerLevel = 3;

// Hunter config
export var hunter_distance_attack = 15;
export var hunter_intervalTime_attack = 6;
export var hunter_distance_playerMonster = 3;

// Guardian config
export var guardian_defaultDistanceMetin = 3;
export var guardian_maxDistanceMetin = 20;
export var guardian_maxVisualPlayer = 15;
export var guardian_distance_playerMonster = 3;
export var guardian_rotating_rocks = 4;
export var guardian_radius_rotating_rocks = 4;

// Final metin confing
export var final_metin_interval_monsters = 30;
export var final_metin_n_monsters = 1;

// Stats config
export var init_life = 100;
export var init_stamina = 100;
export var init_shield = 100;
export var init_coin = 0;
export var init_int = 0;
export var init_key = 0;

export var map_dimension = 200;
export var physical_map_dimension = 400;

// Sword stats
export const sword_stats = [
    {
        name : "sword_1",
        name_inv: "bamboo sword",
        base_atk : 20,
        intelligence_required : 0,
        intelligence_special_ability : 2,
        duration_special_ability : 10,
        cooldown_special_ability : 15,
        color_trail1 : 0x0ffff,
        color_trail2 : 0x040ff
    },
    {
        name : "sword_2",
        name_inv: "moon sword",
        base_atk : 35,
        intelligence_required : 5,
        intelligence_special_ability : 8,
        duration_special_ability : 30,
        cooldown_special_ability : 25,
        color_trail1 : 0xff4500,
        color_trail2 : 0xffd700
    },
    {
        name : "sword_3",
        name_inv: "poisoned sword",
        base_atk : 50,
        intelligence_required : 10,
        intelligence_special_ability : 12,
        duration_special_ability : 30,
        cooldown_special_ability : 30,
        color_trail1 : 0x9b30ff,
        color_trail2 : 0xff00ff
    }
];
export var init_atk = sword_stats[0].base_atk;

/* ------------------------------------------------------------------------ */
export function updateParameters(start_level)
{
    // Applying the updating to the global variables
    current_level = current_level + 1;

    switch (current_level)
    {
        case 2:
            number_metin = 20;
            probability_key = 0.1;
            monster_life = 10;
            number_hunter_per_metin = 2;
            number_guardian_per_metin = 2;
            break;
        
        case 3:
            number_metin = 0;
            probability_key = 0;
            monster_life = 15;
            number_hunter_per_metin = 2;
            number_guardian_per_metin = 2;
            break;
    }
}

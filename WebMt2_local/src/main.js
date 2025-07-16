import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

import * as UTILITY from './utility.js';
import * as CONFIG  from './config.js';
import * as DM from './managerDialog.js';

let pi = Math.PI;

// Environment parameters
let scene, camera, renderer, controls, raycaster, directional_arrow;
let minimapRenderer, minimapCamera, markers_minimap = [], player_arrow;
let sky, sun, sun_light, ambient_light, shadow_status = false;
let ground, flag_ground = false;
let clock, control_acquired = false, control_keyboard = true;
let keys = {};

// Videogame items
let status_game = "playing";
let sword_flag = false; let sword_texture_flag = false; 
let sword; let sword_number; let next_sword_droppable; 
let sword_item; let sword_item_flag;
let chest_dropped = false;
let timer_outside_started = false; let timer_outside;

// Object items
let metin_flag = false; let metin_texture_flag = false; let crack_texture_flag = false;
let sword_model, tree_model, metin_model; let tree_flag = false, fragment_metin_model, fragment_metin_model_flag;
let tent_model, tent_flag = false, tent_spawned = false;
let sword_texture, metin_texture, crack_texture;
let coin_model, coin_flag = false;
let key_model, key_flag = false;
let heart_model, heart_flag = false;
let chest_model, chest_flag = false;
let anvil_model, anvil_flag = false; 
let monolith_model, monolith_flag = false; 
let raytracer_flag = false;

let target_metin;
let target_coin; let collecting_animation = false;
let target_key;

let final_metin_model; let final_metin_model_flag = false;
let circle_modality = 0;

let watched_item, watching_item_animation = false;
let mob_model, mob_texture, mob_flag = false, mob_texture_flag = false;
let spell_model, spell_model_flag = false;
let blood_texture, blood_texture_flag = false, blood_overlay, blood_visible_flag = false;
let spawned_mob = []; let spell_casted = []; let solid_objects = []; let collected_keys = [];
let metins = []; let spawned_coins = []; let spawned_keys = []; let spawned_trees = []; let items = [];
let inventory = []; let fragments = []; let metin_toBeDestroyed = [];
let to_beCleaned = []; let cleaning_terminated = false;

// Rain parameters
const rain_count = 1500;
let rain_geometry;
let rain_positions;    // Each line has a start-point and an end-point
let rain; let rain_speed = 0.3; let active_rain_count = rain_count;


// Sky parameters
const sky_parameters = [
    {
        turbidity   : 15,
        rayleigh    :  1,
        mieCoefficient : 0.001,
        mieDirectionalG : 0.7,
        elevation: 10,
        azimuth : 180
    },
    {
        turbidity   : 15,
        rayleigh    :  1,
        mieCoefficient : 0.001,
        mieDirectionalG : 0.7,
        elevation: 0,
        azimuth : 0 // 180
    },
    {
        turbidity   : 15,
        rayleigh    :  0.002,
        mieCoefficient : 0.0001,
        mieDirectionalG : 0.7,
        elevation: 0,
        azimuth : 180
    }
];

// Parameters for rotation and size of swords
const sword_configs = [
    {
        scaling: [0.1, 0.1, 0.1],
        positions: [0.1, -0.12, -0.12],
        rel_pos: [0, 0.6, 0],
        degrees: [0, 0, -90]
    },
    {
        scaling: [0.15, 0.15, 0.15],
        positions: [0.15, -0.15, -0.15],
        rel_pos: [0, 0, 0],
        degrees: [0, 90, 0]
    },
    {
        scaling: [0.1, 0.1, 0.1],
        positions: [0.1, -0.13, -0.13],
        rel_pos: [0, 0.7, 0],
        degrees: [60, 0, 0]
    }
];

// Parameters for special ability animation
const sword_ability_parameters = [
    {max_height : 1.5, radius : 0.15},
    {max_height : 1.1, radius : 0.15},
    {max_height : 1.6, radius : 0.2},
]

// Animations parameters for fighting and defense
let is_walking = false; let is_sprinting = false; let is_recharging = false;
let is_fighting = false; let is_returning = false;
let is_defending = false; let is_returning_defense = false;
let swordAnimationTime = 0; let swordAnimationTimeDefending = 0;
let swordDirection = 1; let swordDirectionDefending = 1; 
const swordAnimationDuration = 0.2; const swordAnimationDurationDefending = 0.2;
const swordKeyframes = [[0, 0, -30], [-90, 0, 0]];
const swordKeyframesDefense = [[0, 0, -30], [0, 0, 60]];

// Parameters to handle special ability of the current sword
let last_activation_ability = 0;
let ability_activable = false;
let cool_down_phase = true;
let last_starting_ability = 0;

// Starting the game
function start_game()
{
    status_game = "playing";
    init();
    animate();

    controls.lock();
    control_acquired = true;
}
window.start_game = start_game;


/* ------------------------------------ GAME MANAGEMENT ---------------------------------- */
function init()
{
    // Scene
    scene = new THREE.Scene();

    // Creating the sky
    init_sky(CONFIG.current_level);

    // Camera
    camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 0.1, 1000);
    let x = 0; let z = 0;
    if ( CONFIG.random_spawn ) // Random position of spawn
    {
        x = (Math.random() - 0.5) * (CONFIG.map_dimension); 
        z = (Math.random() - 0.5) * (CONFIG.map_dimension);
    }
    camera.position.set(x, 1.6, z);

    // Minimap
    create_minimap();
    create_marker_player();
    create_map_limits();

    // Show the shadows if needed
    if ( CONFIG.show_shadows )
        manage_shadow();
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;

    // Raycaster, useful to implement Raycasting
    raycaster = new THREE.Raycaster();

    // Init of player's stats
    DM.initStats(CONFIG.init_atk, CONFIG.init_life, CONFIG.init_coin, CONFIG.init_int, CONFIG.init_key);
    
    // Map generation
    generate_map();

    // Clock
    clock = new THREE.Clock();

    // Init event listener
    init_eventListeners();

    // Spawn the arrow useful to know where it is the tent
    spawn_arrow();

    // Sword and texture associated
    UTILITY.loadGLBModel("sword_model_1.glb", (model) => {sword_model = model; sword_model.userData.n = 1; sword_flag = true; sword_number = 1; add_sword_to_inventory(sword_model);});
    next_sword_droppable = 2;
    sword_texture_flag = true;

    // Load tree and bush models
    if ( CONFIG.show_vegetations )
        UTILITY.loadGLBModel("tree_model.glb", (model) => {tree_model = model; tree_flag = true});
    
    // Load metin and coin model
    if ( CONFIG.show_metin )
    {
        UTILITY.loadGLBModel('metin_model.glb',(model) => {metin_model = model; metin_flag = true});
        UTILITY.loadGLBModel('fragment_metin.glb',(model) => {fragment_metin_model = model; fragment_metin_model_flag = true});
        UTILITY.loadTexture('metin_texture.jpg',(model) => {metin_texture = model; metin_texture_flag = true});
        UTILITY.loadTexture('crack_texture.png',(model) => {crack_texture = model; crack_texture_flag = true});
        UTILITY.loadGLBModel('coin_model.glb',(model) => {coin_model = model; coin_flag = true});
        UTILITY.loadGLBModel('key_model.glb',(model) => {key_model = model; key_flag = true});
    }
    
    // Load tent model, heart model and chest model
    if ( CONFIG.show_tent )
    {
        UTILITY.loadGLBModel("tent_model.glb", (model) => {tent_model = model; tent_flag = true});
        UTILITY.loadGLBModel("heart_model.glb", (model) => {heart_model = model; heart_flag = true});
        UTILITY.loadGLBModel("chest_model.glb", (model) => {chest_model = model; chest_flag = true});
        UTILITY.loadGLBModel("anvil_model.glb", (model) => {anvil_model = model; anvil_flag = true});
        UTILITY.loadGLBModel("monolith_model.glb", (model) => {monolith_model = model; monolith_flag = true});
    }

    // Load the monster model
    if ( CONFIG.show_monsters )
    {
        UTILITY.loadGLBModel("mob_model.gltf", (model) => {mob_model = model; mob_flag = true;});
        UTILITY.loadTexture("mob_texture.png", (tex) => {mob_texture = tex; mob_texture_flag = true});
        UTILITY.loadGLBModel("spell_model.glb", (model) => {spell_model = model; spell_model_flag = true});
        UTILITY.loadTexture("blood.png", (tex) => {blood_texture = tex; blood_texture_flag = true});
    }

    // Add the camera to the scenea
    scene.add(camera)
}

function animate()
{
    const delta = clock.getDelta();

    // Blocking vertical position of the player
    controls.object.position.y = 1.6;
    check_game_over();

    switch (status_game)
    {
        case "playing":
            animate_playing(delta);
            break;
        
        case "switching_level":
            animate_switching_level(delta);
            animate_cleaning(delta);
            reinit_map();
            break;

        case "final_level":
            animate_final_level(delta);
            break;

    }

    // Animate the scene every delta time (frame)
    requestAnimationFrame(animate);
    handle_input(delta);
    renderer.render(scene, camera);

    // Rendering of the minimap
    minimap_rendering();
}

function handle_input(delta) 
{
    // We must have the possibility to use the keyboard
    if ( !control_keyboard ) return;

    // Get the stats of the player
    var stats = DM.getCurrentStats();
    var stamina = stats[5];

    // If the player is moving and/or is sprinting
    is_walking = keys['w'] || keys['a'] || keys['s'] || keys['d'];
    is_sprinting = keys['shift'] && stamina > 0.5 && is_walking && !is_recharging;

    // Bounds of velocity
    let speed;
    let base_speed = 8;
    
    // Sprint variables
    const stamina_drain_rate = 30;
    const stamina_regen_rate = 30;
    const sprint_multiplier = 1.5;
    
    // Computing the movement direction required
    let direction = new THREE.Vector3();
    if (keys['w']) direction.z -= 1;
    if (keys['s']) direction.z += 1;
    if (keys['a']) direction.x -= 1;
    if (keys['d']) direction.x += 1;

    if ( is_sprinting )
    {
        // Drain the stamina
        stamina -= stamina_drain_rate * delta;
        stamina = Math.max(stamina, 0);

        // The speed is increased
        speed = base_speed * sprint_multiplier;
    }
    else 
    {
        // The first time we signal that the stamina is recharging
        if ( !is_recharging )
            is_recharging = true;
        
        // Regeneration of the stamina
        stamina += stamina_regen_rate * delta;
        stamina = Math.min(stamina, CONFIG.init_stamina);

        // When the stamina is at 50, we can sprint again
        if ( stamina > 50 )
            is_recharging = false;

        // The speed is base
        speed = base_speed;
    }
    
    // Update the stamina
    DM.updateStamina(stamina, CONFIG.init_stamina);

    // Apply the movement in the direction required, if it is possible
    if (direction.length() > 0)
    {
        direction.normalize();
        let moveDirection = direction.applyQuaternion(controls.object.quaternion);
        moveDirection.y = 0; // The player is blocked on the ground

        // Check that the new position doesn't exceed from the map limits and is valid
        let currentPosition = controls.object.position.clone();
        let nextPosition = currentPosition.clone().addScaledVector(moveDirection, speed * delta);

        // Updating the position
        if ( can_move_to(nextPosition) )
            controls.object.position.copy(nextPosition);
    }
    
    // If the player is trying to collect a coin
    if ( target_coin && keys['c'] )
        animate_collection_coin(); // Start the animation of collecting the coin
    
    // If the player is trying to collect a key
    if ( target_key && keys['c'] )
        animate_collection_key(); // Start the animation of collecting the key
    
    // If the player is trying to collect the new sword
    if ( sword_item && keys['c'] )
        animate_collection_item(); // Start the animation of collecting the new sword
    
    // If exists a watched item and the player is trying to interact with it (key R)
    // N.B. this code is executed in every frame. We must manage this fact.
    if ( watched_item && keys['r'] )
    {
        keys['r'] = false; // Otherwise I will call the interaction in several consecutive frames
        
        // Dispatch the operation based on the name of the item watched
        execute_interaction();
    }

    // If the player is trying to change the sword from the inventory
    if ( keys['1']) 
        change_sword(1);
    else if ( keys['2'] )
        change_sword(2);
    else if ( keys['3'] )
        change_sword(3);
    else if ( keys['4'] )
        activate_special_ability();
}

function init_eventListeners()
{
    // Visual mouse control
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.object);
    document.addEventListener('keydown', (event) => {
        if ( event.code === "KeyQ" )
        {
            if ( !control_acquired && !camera.is_falling )
            {
                controls.lock();
                control_acquired = true;
            }
            else
            {
                controls.unlock();
                control_acquired = false;
            }
        }
    });

    // Input WASD (movement), Space (fighting), x (defense)
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if ( !is_fighting )
            {
                is_fighting = true;
                is_returning = false;
                swordAnimationTime = 0;
                swordDirection = 1;
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            is_returning = true;
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyX' || e.code === 'KeyX') {
            if ( !is_defending && !( camera.userData.shieldActive || camera.userData.rechargingPhaseShield ))
            {
                is_defending = true;
                is_returning_defense = false;
                swordAnimationTimeDefending = 0;
                swordDirectionDefending = 1;
                create_shield();
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyX' || e.code === 'KeyX') 
        {
            if ( is_defending )
            {
                is_defending = false;
                is_returning_defense = true;
                swordAnimationTimeDefending = 0;
                swordDirectionDefending = -1;
                remove_shield();
            }
        }
    });
    
    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Scaling correctly the overlay
        if ( !blood_texture_flag ) return;
        const height = 2 * Math.tan(camera.fov * Math.PI / 180 / 2) * distance;
        const width = height * camera.aspect;
        blood_overlay.scale.set(width, height, 1);
    });
}

function execute_interaction()
{
    if ( !watched_item ) return; // Must exists a watched item

    // Current stats of the player
    let stats = DM.getCurrentStats();

    // Based on the watched_item
    switch( watched_item.name )
    {
        case "heart_model": // The refuel of life can be done once in 2 minutes, if the life is under 100
            if ( parseInt(stats[2]) < 100 && (clock.getElapsedTime() - watched_item.userData.itemUsed > 60))
            {
                // Refuel of life
                DM.updateLife(100, CONFIG.init_life);
                DM.showNewMessageStats("Life up!");

                // Set the timer
                watched_item.userData.itemUsed = clock.getElapsedTime();
            }
            else if ( parseInt(stats[2]) >= 100 )
                DM.showNewMessageStats("No need to refuel life!");
            else
                DM.showNewMessageStats("You must wait a minute to refuel your life!");
            break;

        case "chest_model": // We spawn the new sword near the player if it is possible
            if ( parseInt(stats[3]) >= CONFIG.sword_stats[next_sword_droppable - 1].intelligence_required && !chest_dropped )
            {
                // The chest drops the next sword droppable, once at level
                chest_dropped = true;
                load_item_sword();
                next_sword_droppable += 1;
            }
            else if ( chest_dropped )
                DM.showNewMessageStats("Chest already used in this level!");
            else
                DM.showNewMessageStats("Improve your intelligence!");
            break;
        
        case "anvil_model": // The upgrade of the attack value can be done if there is at least a coin available with the player
            if ( parseInt(stats[1]) > 0 )
            {
                // Update the attack value (cutting at the first decimal value)
                // We adopt a diminishing returns formula 
                let new_value = parseFloat(stats[0]) + (Math.sqrt(parseInt(stats[1])) * 1.5) + (parseInt(3) * 0.8);
                new_value = Math.round(new_value * 10) / 10;
                DM.updateAttack(new_value);
                sword_model.userData.atk = new_value; 
                DM.showNewMessageStats("Upgrade completed!");
                DM.updateCoin(0) // Reset the coin already used
            }
            else
                DM.showNewMessageStats("No coin available!");
            break;

        case "monolith_model": // We can change the level if we have a key
            if ( parseInt(stats[4]) > 0 )
            {
                switch_level();
                DM.updateKey(0);
                spawned_keys = [];
            }
            else // No enough key to switch level
                DM.showNewMessageStats("You don't have any key!");
            break;
    }
}

function check_limit_map(delta)
{
    // Here we check the limit of the map. If the player's current position
    // exceeds this limits then we start a timer, and when the timer expires
    // we teleport the player at the origin of the map.
    // Consider that the map is a logical square
    const current_position = camera.position;

    // Here we are outside the map
    if ( Math.abs(current_position.x) > (CONFIG.map_dimension / 2) || Math.abs(current_position.z) > (CONFIG.map_dimension / 2) )
    {
        // If the timer is not started we start
        if ( !timer_outside_started )
        {
            timer_outside = 0;
            timer_outside_started = true;

            DM.showNewMessage("You are outside the map!! <br/> Return in 5 seconds!");
        }
        else
        {
            // The timer is already started and we increase it
            timer_outside += delta;

            // If the timer is expired
            if ( timer_outside > 5 )
            {
                // Here we report the player at the origin
                controls.object.position.set(0, 30, 0);
                timer_outside_started = false;
                timer_outside = 0;
                camera.startHeight = 10;
                camera.gravity = -9.81;
                camera.is_falling = true;
                camera.falling_time = 0;

                // Disable the controls of the players
                control_keyboard = false;
                controls.unlock();

                DM.clearMessageDialog();
            }
        }
    }
    else
    {
         if ( timer_outside_started )
            DM.clearMessageDialog();
        
        timer_outside_started = false;
        timer_outside = 0;
    }
}

function animate_respawn(delta)
{
    if ( ! camera.is_falling ) return;

    // Here the player is falling. We apply the gravity force to simulate the fall in the map
    camera.falling_time += delta;

    // New y position
    var new_y = camera.startHeight + 0.5 * camera.gravity * camera.falling_time * camera.falling_time;
    
    // Setting the new position
    camera.position.set(camera.position.x, new_y, camera.position.z);

    // If we reached the plane we stop the animation
    if ( new_y <= 1.6 )
    {
        camera.position.set(camera.position.x, 1.6, camera.position.z);
        camera.is_falling = false;
        camera.falling_time = 0;

        if ( control_acquired )
            controls.lock();
        control_keyboard = true;

        DM.clearMessageDialog();
    }
}

function animate_playing(delta)
{
    // Loading sword
    if ( sword_flag && sword_texture_flag )
        load_sword();

    // Dynamics of sword model
    if ( sword_model )
    {
        move_animation_sword(); // Sword animation when the player is moving around the map
        fight_animation_sword(delta); // Sword animation when the player is fighting
    }

    // Spawn the ten with associated items
    if ( CONFIG.show_tent && tent_flag && heart_flag && chest_flag && anvil_flag )
        spawn_tent();
    
    // To catch when an item in the tent is watched by the player
    if ( CONFIG.show_tent && raytracer_flag )
    {
        catch_item(); 
        show_item_sword();
        highlight_nearest_item();
    }
        
    // Spawn vegetation at random in the map
    if ( CONFIG.show_vegetations && tree_flag && flag_ground )
        spawn_vegetation(CONFIG.physical_map_dimension, CONFIG.physical_map_dimension);

    // Spawn metins at random in the map
    if ( CONFIG.show_metin && metin_flag && metin_texture_flag && metin_texture_flag )
        spawn_metin(CONFIG.map_dimension, CONFIG.number_metin);
    
    // Highlight the nearest metin and coins
    if ( CONFIG.show_metin )
    {
        highlight_nearest_metin();
        highlight_nearest_coin(); // Coin will spawn only if there is some metin
        highlight_nearest_key(); // Key will spawn only if there is some metin
        update_metin_debris(delta);
        update_metin_fragments(delta);
    }
        
    // If there exists some coins or keys, we have to animate it
    if ( spawned_coins.length > 0 )
        animate_coins(delta);
    if ( spawned_keys.length > 0 )
        animate_keys(delta);
    if ( sword_item )
        animate_spawning_item_sword(delta);
    
    // If we are collecting a coin or key , we animate the collection
    if ( target_coin && collecting_animation )
        animate_collection_coin();
    if ( target_key && collecting_animation )
        animate_collection_key();
    if ( sword_item && collecting_animation )
        animate_collection_item();
    
    // If there is possible to have monster we animate it (and related stuffs)
    if ( CONFIG.show_monsters && CONFIG.show_metin )
    {
        // Animating monster and their dynamic
        animate_monster(delta);
        animate_spawning_monster(delta);
        animate_guardian_rocks(delta);
        animate_spell(delta);
        hit_guardians(delta);
        animate_shaking_monster(delta);
        movement_temporary(delta);
        update_movement_fragment(delta);
        animate_pre_explosion_monster(delta);
        update_marker_monster();
        create_blood_overlay();
        fadeOut_blood_damage();
        update_monster_health_bar();
    }

    // Animating the player's shield
    animate_spawn_shield(delta);
    animate_despawn_shield(delta);
    animate_following_shield(delta);
    animate_shield(delta);

    // When the metin is hitted we animate the hit
    animate_shaking_metin(delta);
    
    // If the player is watching some item then it must rotate. The function handles itfself
    // all the check that must be performed
    rotation_watched_item();
    animate_arrow();
    
    // Respawn and map limit checks
    check_limit_map(delta);
    animate_respawn(delta);

    // Switching sword animation
    animate_showing_from_inventory(delta);

    // Defense animation
    defense_animation_sword(delta);

    // Animate the special ability if it is activated
    check_special_ability();
    animate_particles(delta);
}

function animate_final_level(delta)
{
    // Spawn final metin and animate it
    spawn_final_metin(delta);
    animate_impact(delta);
    spawn_monster_final_metin(delta);

    // Animate raining drops
    animate_rain(delta);
    
    animate_playing(delta);
}

function check_game_over()
{
    // Execute the function only if the game over mechanism
    // is flagged to be active
    if ( !CONFIG.game_over_active ) return;
    
    // If we have already triggered the game over we don't have
    // anything to do anymore
    if ( status_game === "game_over" ) return;
    
    // Check the current life of the player
    const stats = DM.getCurrentStats();

    if ( parseFloat(stats[2]) <= 0 )
    {
        // Disable al controls and signal game over
        controls.unlock();
        control_keyboard = false;
        status_game = "game_over";
        window.game_over();
    }
}

function trigger_win()
{
    status_game = "game_win";
    controls.unlock();
    window.win();
}

function manage_shadow()
{
    if ( !sun_light ) return;
    
    if ( !shadow_status ) // Enable shadows
    {
        sun_light.castShadow = true;
        sun_light.shadow.mapSize.width = 2048;
        sun_light.shadow.mapSize.height = 2048;
        sun_light.shadow.camera.left = -50;
        sun_light.shadow.camera.right = 50;
        sun_light.shadow.camera.top = 50;
        sun_light.shadow.camera.bottom = -50;
        sun_light.shadow.camera.near = 1;
        sun_light.shadow.camera.far = 200;
        sun_light.shadow.camera.updateProjectionMatrix();
        sun_light.shadow.enabled = true;
        shadow_status = true;
    }
    else // Disable shadows
    {
        sun_light.castShadow = false;
        sun_light.shadow.enabled = false;
        shadow_status = false;
    }
}
window.manage_shadow = manage_shadow;


/* ------------------------------ MINIMAP MANAGEMENT ---------------------------   */
function create_minimap()
{
    // We create the minimap in a specific section of the page
    const minimapCanvas = document.getElementById('minimapCanvas');

    // We need a new renderer object
    minimapRenderer = new THREE.WebGLRenderer({
        canvas: minimapCanvas, // The result of the rendering will be shown
        alpha: true            // in the minimapCanvas
    });

    // Dimensioning and setting the bakground (transparent) of the minimap
    minimapRenderer.setSize(200, 200);
    minimapRenderer.setClearColor(0x000000, 0); // Black and trasparent (alpha = 0)

    // The minimap is implemented with an orthographic camera which watch the world
    // from top
    minimapCamera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
    minimapCamera.up.set(0, 0, -1);
}

function minimap_rendering()
{
    // The minimap camera must follow the player and must be oriented as the player (normal camera)
    minimapCamera.position.set(camera.position.x, 100, camera.position.z);
    minimapCamera.lookAt(camera.position.x, 0, camera.position.z);

    // Make marker visible for the minimap rendering
    show_markers_minimap();

    // Positioning the marker on the map to follow the player
    player_arrow.position.set(camera.position.x, 0.2, camera.position.z);

    // Rotating the player marker as the direction of the camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const angle = Math.atan2(direction.x, direction.z);
    player_arrow.rotation.z = Math.PI - angle;

    // Minimap render
    minimapRenderer.render(scene, minimapCamera);

    // Disable marker in order to don't show on the principal scene
    hide_markers_minimap();
}

function show_markers_minimap() 
{
    // Show the marker to the scene for rendering
    for (const marker of markers_minimap)
        marker.visible = true;
}

function hide_markers_minimap() 
{
    // Hide the markers from the scene
    for (const marker of markers_minimap)
        marker.visible = false;
}

function create_marker_player() 
{
    // Creating the shape of the player marker, a triangle
    const shape = new THREE.Shape();
    shape.moveTo(0, 2);
    shape.lineTo(-1.2, -1);
    shape.lineTo(1.2, -1); 
    shape.lineTo(0, 2);   

    // Creating the marker
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    const arrow = new THREE.Mesh(geometry, material);
    arrow.scale.set(3,3,3);

    // Correctly positioning and rotating the marker
    arrow.rotation.x = -Math.PI / 2; 
    arrow.rotation.y = Math.PI;
    arrow.position.y = 20;        
    
    // Adding the marker to the proper array and to the scene
    scene.add(arrow);
    markers_minimap.push(arrow);
    player_arrow = arrow;
}

function create_marker_metin(metin, color_marker=0xffff00) 
{
    if ( !metin ) return;
    
    // Creating the marker for the metin as a small yellow sphere
    const geometry = new THREE.SphereGeometry(0.8, 8, 8); 
    const material = new THREE.MeshBasicMaterial({ color: color_marker }); 
    const marker = new THREE.Mesh(geometry, material);

    // Setting the marker in corrispondence of the metin passed as a parameter
    marker.position.set(metin.position.x, 40, metin.position.z);
    marker.scale.set(2,2,2);

    // Adding the marker to the scene and in the proper array
    metin.userData.markerMinimap = marker;
    scene.add(marker);
    markers_minimap.push(marker);
    marker.visible = false;
}

function create_marker_tent(tent) 
{
    if ( !tent ) return;
    
    // Creating the marker for the tent as a small blue sphere
    const geometry = new THREE.SphereGeometry(0.8, 8, 8); 
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); 
    const marker = new THREE.Mesh(geometry, material);

    // Setting the marker in corrispondence of the tent passed as a parameter
    marker.position.set(tent.position.x, 40, tent.position.z);
    marker.scale.set(5,5,5);

    // Adding the marker to the scene and in the proper array
    tent.userData.markerMinimap = marker;
    scene.add(marker);
    markers_minimap.push(marker);
    marker.visible = false;
}

function create_marker_monster(monster) 
{
    if ( !monster ) return;
    
    // Creating the marker for the monster as a small red sphere
    const geometry = new THREE.SphereGeometry(0.8, 8, 8); 
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
    const marker = new THREE.Mesh(geometry, material);

    // Setting the marker in corrispondence of the monster passed as a parameter
    marker.position.set(monster.position.x, 40, monster.position.z);
    marker.scale.set(2,2,2);

    // Adding the marker to the scene and in the proper array
    monster.userData.markerMinimap = marker;
    scene.add(marker);
    markers_minimap.push(marker);
    marker.visible = false;
}

function remove_marker_object(object)
{
    // If the object exists
    if ( !object || !object.userData.markerMinimap ) return;
    
    // Remove from the array the marker associated to the object
    markers_minimap = markers_minimap.filter(o => o !== object.userData.markerMinimap); 
    object.userData.markerMinimap = undefined;
}

function update_marker_monster()
{
    // Analyzing all the monster and update the marker on the minimap
    for ( const monster of spawned_mob )
    {
        monster.userData.markerMinimap.position.copy(monster.position);
        monster.userData.markerMinimap.position.y = 10;
    }
}

function update_marker_metin(metin)
{
    // Check that exists a marker for the metin
    if ( !metin.userData.markerMinimap ) return;

    // Replace the marker of the metin with a new colored mark
    // to notify that this metin has been already hit
    remove_marker_object(metin);
    create_marker_metin(metin, 0xec5800);
}

function create_map_limits()
{
    // Coordinates
    var xMin, zMin, xMax, zMax;
    xMin = zMin = -CONFIG.map_dimension / 2;
    xMax = zMax = +CONFIG.map_dimension / 2;
    
    // Building the square (4 vertices) with the coordinates
    const points = [
        new THREE.Vector3(xMin, 0.1, zMin),
        new THREE.Vector3(xMax, 0.1, zMin),
        new THREE.Vector3(xMax, 0.1, zMax),
        new THREE.Vector3(xMin, 0.1, zMax),
        new THREE.Vector3(xMin, 0.1, zMin) // To close the square
    ];

    // Building the dashed line 
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color: 0x00ff00,
        dashSize: 3, 
        gapSize: 1.5,
        linewidth: 1 
    });
    const border = new THREE.Line(geometry, material);
    border.computeLineDistances(); // As the official documentation says

    // Adding the minimap to the scene
    scene.add(border);
    markers_minimap.push(border);
}


/* -------------------------------- ENVINRONMENT MANAGEMENT -------------------------- */
function get_safe_random_point(area_size) 
{
    // Setting the safe margins
    const margin = 5;
    const min_distance_from_solids = 5;
    const min_distance_from_camera = 5;

    // Trying to generate the point
    let x, z;
    const point = new THREE.Vector3();
    let done = false;

    do 
    {
        x = (Math.random() - 0.5) * (area_size - margin);
        z = (Math.random() - 0.5) * (area_size - margin);
        point.set(x, 0, z);

        // Checking distances
        const is_far_from_camera = point.distanceTo(camera.position) > min_distance_from_camera;
        
        let is_far_from_solids = true;
        for (const obj of solid_objects) 
        {
            const obj_pos = obj.position;
            if (point.distanceTo(obj_pos) < min_distance_from_solids) 
            {
                is_far_from_solids = false;
                break;
            }
        }
        done = is_far_from_solids && is_far_from_camera;

    } while (!done);

    return point;
}

function generate_map()
{
    // Load the grass texture
    UTILITY.loadTexture("grass_texture.jpg", (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(50, 50);

        const groundGeometry = new THREE.PlaneGeometry(CONFIG.physical_map_dimension, CONFIG.physical_map_dimension);
        groundGeometry.rotateX(-Math.PI / 2);
        const groundMaterial = new THREE.MeshStandardMaterial({map: tex});

        ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.set(0,0,0);
        ground.receiveShadow = true;
        scene.add(ground);
        flag_ground = true;
    });
}

function spawn_vegetation(areaSize, numTrees)
{
    if ( !tent_spawned ) return; // We must wait the spawning of the tent
    tree_flag = false;
    
    // Generation of trees
    for (let i = 0; i < numTrees; i++) 
    {
        const tree = tree_model.clone();
        tree.position.copy(get_safe_random_point(areaSize));
        
        tree.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(tree);
        tree.scale.set(0.5, 0.5, 0.5);
        spawned_trees.push(tree);
        tree.userData.boundingBox = create_bounding_box_around(tree);
        solid_objects.push(tree);
    }
}

function spawn_metin(areaSize, numMetin)
{
    if ( !tent_spawned ) return; // We must wait the spawning of the tent
    metin_flag = false;
    
    crack_texture.wrapS = THREE.RepeatWrapping;
    crack_texture.wrapT = THREE.RepeatWrapping;
    crack_texture.repeat.set(4, 4); // ripeti 4 volte in orizzontale e verticale

    // Generation of metins
    for (let i = 0; i < numMetin; i++)
    {
        const metin = metin_model.clone();
        metin.position.copy(get_safe_random_point(areaSize));
        metin.userData.emissive_materials = [];
        
        // Adding the metin to the scene
        metin.userData.emissiveColor = 0x770000;
        metin.scale.set(1,1,1);
        metin.traverse(child => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    map: metin_texture,
                    metalness: 0.5,
                    emissiveMap: crack_texture,
                    emissive: new THREE.Color(metin.userData.emissiveColor),
                    emissiveIntensity: 2,
                });

                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;

                metin.userData.emissive_materials.push(material);
            }
        });
        solid_objects.push(metin);
        scene.add(metin);
        
        // Setting hyperparameters of the metin
        metin.userData.life = CONFIG.metin_life_additive_term + CONFIG.current_level * CONFIG.metin_life_coefficient;
        metin.userData.maxLife = CONFIG.metin_life_additive_term + CONFIG.current_level * CONFIG.metin_life_coefficient;
        metin.userData.spawnedAssociatedMonsters = false;
        metin.userData.originalScale = new THREE.Vector3(0.75, 0.75, 0.75);
        metin.userData.hit = false;
        metins.push(metin);

        // Creating the marker to show the marker in the minimap
        create_marker_metin(metin);
    }
}

function spawn_tent()
{
    tent_flag = false;
    heart_flag = false;
    chest_flag = false;
    anvil_flag = false;
    monolith_flag = false;

    // Tent
    tent_model.position.set(-3, 0, -5);
    tent_model.name = "tent_model";
    tent_model.traverse(child => {
        if (child.isMesh && child.children.length == 0) {
            child.name = "tent_model";
        }
    });
    scene.add(tent_model);
    solid_objects.push(tent_model);
    tent_model.scale.set(0.015, 0.015, 0.015);
    items.push(tent_model);
    create_marker_tent(tent_model);

    // Heart
    heart_model.position.set(-3.40, 1, -2.5);
    heart_model.name = "heart_model";
    heart_model.traverse(child => {
        if (child.isMesh && child.children.length == 0) {
            child.name = "heart_model";
        }
    });
    heart_model.userData.startTime = 0;
    heart_model.userData.itemUsed = -130; // It can be used at the start of the game
    scene.add(heart_model);
    heart_model.scale.set(0.005,0.005,0.005);
    items.push(heart_model);

    // Chest
    chest_model.position.set(-1.75, 1, -2.5);
    chest_model.name = "chest_model";
    chest_model.traverse(child => {
        if (child.isMesh && child.children.length == 0) {
            child.name = "chest_model";
        }
    });
    chest_model.userData.startTime = 0;
    scene.add(chest_model);
    chest_model.scale.set(0.5, 0.5, 0.5);
    items.push(chest_model);

    // Anvil
    anvil_model.position.set(-5, 0.7, -2.5);
    anvil_model.name = "anvil_model";
    anvil_model.traverse(child => {
        if (child.isMesh && child.children.length == 0) {
            child.name = "anvil_model";
        }
    });
    anvil_model.userData.startTime = 0;
    scene.add(anvil_model);
    anvil_model.scale.set(0.25, 0.25, 0.25);
    items.push(anvil_model);

    // Monolith
    monolith_model.position.set(1, 0, -5);
    monolith_model.name = "monolith_model";
    monolith_model.traverse(child => {
        if (child.isMesh && child.children.length == 0) {
            child.name = "monolith_model";
        }
    });
    monolith_model.userData.startTime = 0;
    scene.add(monolith_model);
    monolith_model.scale.set(0.001, 0.001, 0.001);
    items.push(monolith_model);
    monolith_model.userData.boundingBox = create_bounding_box_around(monolith_model);
    solid_objects.push(monolith_model);

    // Now we can try to catch it
    raytracer_flag = true;
    tent_spawned = true;
}

function spawn_arrow()
{
    // Spawn the arrow only if it is necessary
    if ( CONFIG.spawn_tent == false ) return;
    
    // Structure of the arrow
    const shaft = new THREE.CylinderGeometry(0.02, 0.02, 0.1);
    const head = new THREE.ConeGeometry(0.04, 0.1);
    const shaftMesh = new THREE.Mesh(shaft, new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    const headMesh = new THREE.Mesh(head, new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    shaftMesh.position.y = 0;
    headMesh.position.y = 0.1;

    // Outline of the arrow
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.BackSide // The rendering of the outline must be done only for the internal side
    });

    const shaftOutline = new THREE.Mesh(shaft, outlineMaterial);
    shaftOutline.position.copy(shaftMesh.position);
    shaftOutline.scale.multiplyScalar(1.1); // leggermente più grande

    const headOutline = new THREE.Mesh(head, outlineMaterial);
    headOutline.position.copy(headMesh.position);
    headOutline.scale.multiplyScalar(1.1);

    // Composing the arrow
    const arrowGroup = new THREE.Group();
    arrowGroup.add(shaftOutline);
    arrowGroup.add(headOutline);
    arrowGroup.add(shaftMesh);
    arrowGroup.add(headMesh);

    // Positioning the arrow and apply it on the plane XZ
    // We have to be careful beacuse now the y-axis is on the plane xz
    // so when we want to rotate the arrow the rotation must occurs on axis-z
    arrowGroup.position.set(0, 1.8, -2);
    arrowGroup.rotation.x = -pi/2;
    camera.add(arrowGroup);
    directional_arrow = arrowGroup;
}

function animate_arrow()
{
    // Check if arrow and tent are already loaded
    if ( !tent_model || !directional_arrow ) return;
    
    // Computing the vector which represents the direction from the player to tent
    const direction_to_tent = new THREE.Vector3().subVectors(tent_model.position, camera.position).normalize();
    direction_to_tent.y = 0;

    // Computing the vector which represents the visual direction of the player
    const camera_direction = new THREE.Vector3();
    camera.getWorldDirection(camera_direction).normalize();
    camera_direction.y = 0;

    // Computing the dot-product wich gives us the cos(angle), because the vectors are already normalized
    const dot = camera_direction.dot(direction_to_tent);
    const rawAngle = Math.acos(dot); // Now we extract the angle, without knowing if the rotation is clockwise or not

    // Computing the cross-product: camera_direction x direction_to_tent
    const cross = camera_direction.x * direction_to_tent.z - camera_direction.z * direction_to_tent.x;
    
    // The rotation is clockwise if the cross product is positive
    // To retrieve this consideration, read the one described in the creation of the arrow
    const angle = cross < 0 ? rawAngle : -rawAngle;
    
    // Apply the rotation
    directional_arrow.rotation.z = angle;
}


/* -------------------------------- COLLISION MANAGEMENT ------------------------------ */
function can_move_to(next_pos)
{
    // For this check we model the player as a sphere
    const future_player_model = new THREE.Sphere(next_pos, 0.5);

    for (const obj of solid_objects) 
    {
        // Create bounding box for the first time
        if (!obj.userData.boundingBox) 
            obj.userData.boundingBox = new THREE.Box3().setFromObject(obj);

        // Check collision
        if (obj.userData.boundingBox.intersectsSphere(future_player_model))
            return false;  // There is a collision
    }
    
    return true;  // No collision
}

function create_bounding_box_around(object)
{
    // Center of the future bounding box
    const center = object.position.clone();
    const half_size = 1;

    // Calculating the boundaries of the bounding box
    const min = center.clone().sub(new THREE.Vector3(half_size, 10, half_size));
    const max = center.clone().add(new THREE.Vector3(half_size, 10, half_size));

    const bounding_box = new THREE.Box3(min, max);
    return bounding_box;
}

function check_collision_direction(monster, movement_direction, target, threshold_distance) 
{
    // Setting the origin and direction to check
    const origin = monster.position.clone();
    const direction = movement_direction.clone().normalize();

    const raycaster = new THREE.Raycaster(origin, direction);
    raycaster.far = threshold_distance;
    const intersections = raycaster.intersectObjects(solid_objects, true);

    // If there is at least one collision found
    if (intersections.length > 0) 
    {
        const first_hit = intersections[0];
        const hit_distance = first_hit.distance;

        // Monster-target distance
        const monster_to_target_distance = origin.distanceTo(target.position);

        // If the ostacle is between the monster and the target
        if (hit_distance < monster_to_target_distance) 
            return true;
    }

    return false;
}

function start_temporary_movement(monster, movement_direction, target)
{
    if ( monster.userData.temporaryMovement ) return;
    
    
    // Start the temporary movement
    monster.userData.monster_stucked = false;
    monster.userData.temporaryMovement = true;

    // Direction for which we found a collision
    const normalized_direction = movement_direction.clone().setY(0).normalize();

    // Orthogonal direction
    let perpendicular_direction = new THREE.Vector3(-normalized_direction.z, 0, normalized_direction.x);

    // Right or left with 50% probability
    if (Math.random() < 0.5)
        perpendicular_direction.negate();
    
    // Parameters for temporary movement
    monster.userData.lastTarget = target;
    monster.userData.temporaryDirection = perpendicular_direction;
    monster.userData.temporaryMovementDuration = 1;
    monster.userData.temporaryMovementTime= 0;
}

function movement_temporary(delta)
{
    // Moving temporary the monster flagged
    for ( const m of spawned_mob )
    {
        if ( !m.userData.temporaryMovement ) continue;
        
        m.userData.temporaryMovementTime += delta;

        // Updating the position of the monster
        if ( m.userData.temporaryMovementTime < m.userData.temporaryMovementDuration )
        {
            const increment = m.userData.temporaryDirection.clone().multiplyScalar(m.userData.speed * delta);
            m.position.add(increment);
        }
        else // Temporary movement terminated
            m.userData.temporaryMovement = false;
    }
}


/* ----------------------------------- LEVEL MANAGEMENT ----------------------------- */
function switch_level()
{
    // Status
    status_game = "switching_level";
    cleaning_terminated = false;
    
    // Disable the controls
    control_keyboard = false;
    controls.unlock();
    
    // Change the sky
    sky.userData.timeAnimation = 0;
    sky.userData.animationSwitching = true;
    sky.userData.totalDuration = CONFIG.change_level_duration;
    sky.userData.startLevel = CONFIG.current_level;
    sky.userData.endLevel = CONFIG.current_level + 1;

    DM.showNewMessage("Loading new level ...");

    // Setting the updated parameters
    chest_dropped = false;
    CONFIG.updateParameters(CONFIG.current_level);

    // Deallocate objects already present in the map (metins, monsters, ...)
    start_clean_map();
}

function animate_switching_level(delta)
{
    var from = sky_parameters[sky.userData.startLevel - 1];
    var to = sky_parameters[sky.userData.endLevel - 1];

    if ( sky.userData.animationSwitching )
    {
        // Calculating the percentage
        sky.userData.timeAnimation += delta;
        var t = sky.userData.timeAnimation / sky.userData.totalDuration;
        t = Math.min(t, 1);

        // Interpolating the values
        sky.material.uniforms['turbidity'].value       = THREE.MathUtils.lerp(from.turbidity , to.turbidity, t);
        sky.material.uniforms['rayleigh'].value        = THREE.MathUtils.lerp(from.rayleigh , to.rayleigh, t);
        sky.material.uniforms['mieCoefficient'].value  = THREE.MathUtils.lerp(from.mieCoefficient , to.mieCoefficient, t);
        sky.material.uniforms['mieDirectionalG'].value = THREE.MathUtils.lerp(from.mieDirectionalG , to.mieDirectionalG, t);

        const elevation = THREE.MathUtils.lerp(from.elevation, to.elevation, t);
        const azimuth = THREE.MathUtils.lerp(from.azimuth, to.azimuth, t);
        update_sun_position(elevation, azimuth);

        if ( t >= 1 )
            sky.userData.animationSwitching = false;
    }
}

function start_clean_map()
{
    // If there is one sword item left on the map then it will be removed
    if ( sword_item )
    {
        scene.remove(sword_item);
        sword_item = undefined;
    }
    
    // Array of objects to removed
    if (CONFIG.current_level == 2 )
        var array = [metins, spawned_mob, spawned_keys, spawned_coins];
    else
        var array = [metins, spawned_mob, spawned_keys, spawned_coins, spawned_trees, items];
    var associated_data = [];

    for( var i=0; i < array.length; i++ )
    {
        for ( const obj of array[i] )
        {
            obj.userData.timeClear = 0;
            obj.userData.clearing = true;
            obj.userData.clearingDuration = CONFIG.change_level_duration;
            obj.userData.startScale = obj.scale.clone();

            if ( obj.userData.rotatingRocks )
            {
                for ( const r of obj.userData.rotatingRocks )
                    associated_data.push(r);
            }

            array[i] = array[i].filter(o => o !== obj); // Remove from the array
            remove_marker_object(obj);
            to_beCleaned.push(obj);
        }
    }

    for ( const obj of associated_data )
    {
        obj.userData.timeClear = 0;
        obj.userData.clearing = true;
        obj.userData.clearingDuration = CONFIG.change_level_duration;
        obj.userData.startScale = obj.scale.clone();
        associated_data = associated_data.filter(o => o !== obj); // Remove from the array
        remove_marker_object(obj);
        to_beCleaned.push(obj);
    }
}

function animate_cleaning(delta)
{
    for ( const obj of to_beCleaned )
    {
        // Updating and computing percentage
        obj.userData.timeClear += delta;
        var t = obj.userData.timeClear / obj.userData.clearingDuration;
        t = Math.min(1, t);

        // Linear interpolation to scale out the object
        obj.scale.copy(obj.userData.startScale.clone().multiplyScalar(1 - t));

        if ( t == 1 )
        {
            obj.clearing = false;
            scene.remove(obj);
            to_beCleaned = to_beCleaned.filter(o => o !== obj); // Remove from the array
            solid_objects = solid_objects.filter(o => o !== obj);
        }
    }

    if ( to_beCleaned.length == 0 && !cleaning_terminated )
    {
        cleaning_terminated = true;
        metins = []; 
        spawned_mob = [];
        spawned_coins = [];
        spawned_keys = [];
        collected_keys = [];
    }
}

function reinit_map()
{
    if ( !cleaning_terminated ) return; // The cleaning must be terminated

    // Reinizialization of the map. If the new level is 2 we need to respawn the metins
    // otherwise we need to spawn the final boss
    if ( CONFIG.show_metin && CONFIG.current_level == 2 )
    {
        spawn_metin(CONFIG.map_dimension, CONFIG.number_metin);
        status_game = "playing";
    }
    else if ( CONFIG.current_level == 3 )
    {
        init_final_level();
        
        // Respawning the player into the last level
        camera.position.set(0,0,0);
        camera.lookAt(0,0,-1);
        camera.startHeight = 10;
        camera.gravity = -9.81;
        camera.is_falling = true;
        camera.falling_time = 0;
    }
        
    
    // Reactivating the player's control
    control_keyboard = true;
    if ( control_acquired )
        controls.lock();
}


/* ---------------------------------- SKY MANAGEMENT ------------------------------ */
function init_sky(level) 
{
    // Create objects needed
    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // Sun light
    sun_light = new THREE.DirectionalLight(0xffffff, 1.0);
    sun_light.position.set(100,100,100);
    sun_light.target.position.set(0, 0, 0);
    scene.add(sun_light.target);
    scene.add(sun_light);

    // Ambient light
    ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient_light)
    
    // Sun position
    sun = new THREE.Vector3();

    // Settings of the current level
    set_sky_level(level);
}

function update_sun_position(elevation, azimuth) 
{
    // Computing the angles
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    // Applying the spherical coordinates
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value = sun.clone();

    sun_light.position.copy(sun.clone().multiplyScalar(100));
    sun_light.target.updateMatrixWorld();
}

function set_sky_level(level)
{
    const uniforms = sky.material.uniforms;

    uniforms['turbidity'].value         = sky_parameters[level - 1].turbidity;
    uniforms['rayleigh'].value          = sky_parameters[level - 1].rayleigh;
    uniforms['mieCoefficient'].value    = sky_parameters[level - 1].mieCoefficient;
    uniforms['mieDirectionalG'].value   = sky_parameters[level - 1].mieDirectionalG;
    update_sun_position(sky_parameters[level -1].elevation, sky_parameters[level - 1].azimuth);
}


/* ----------------------------------- SWORD MANAGEMENT ----------------------------- */
function load_sword()
{
    // Only the first time we have to load the sword model
    if ( !sword_flag || !sword_texture_flag ) return;

    sword_flag = false;
    
    // Loading the current parameters
    const param = sword_configs[sword_number - 1];
    const scaling = param.scaling;
    const degrees = param.degrees;
    const positions = param.positions;
    const rel_pos = param.rel_pos;

    sword_model.traverse(child => {
        if (child.isMesh && child.material ) {
            child.material.roughness = 0.5;
            child.material.metalness = 0.2;
            child.material.emissiveIntensity = 1;
        }
    });
    
    // Dimension and positioning of the sword
    sword = new THREE.Object3D();
    sword.scale.set(scaling[0], scaling[1], scaling[2]);
    sword_model.position.set(rel_pos[0], rel_pos[1], rel_pos[2]);
    sword.position.set(positions[0], positions[1], positions[2]);
    sword.add(sword_model);
    sword_model.rotation.set(THREE.MathUtils.degToRad(degrees[0]), THREE.MathUtils.degToRad(degrees[1]), THREE.MathUtils.degToRad(degrees[2]));
    sword.rotation.set(THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-30));

    // Debug
    /*sword.add(new THREE.AxesHelper(2));
    const debug_geo = new THREE.SphereGeometry(0.01);
    const debug_mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const pivot_marker = new THREE.Mesh(debug_geo, debug_mat);
    sword.add(pivot_marker);*/
    
    // Adding the current sword to the camera
    camera.add(sword);
}

function load_sword_from_inventory()
{
    // Only the first time we have to load the sword model
    if ( !sword_flag || !sword_texture_flag ) return;

    sword_flag = false;

    // Loading the current parameters
    const param = sword_configs[sword_model.userData.n - 1];
    const scaling = param.scaling;
    const degrees = param.degrees;
    const positions = param.positions;
    const rel_pos = param.rel_pos;

    sword_model.traverse(child => {
        if (child.isMesh && child.material ) {
            child.material.roughness = 0.5;
            child.material.metalness = 0.2;
            child.material.emissiveIntensity = 1;
        }
    });
    
    // Dimension and positioning of the sword
    sword = new THREE.Object3D();
    sword.scale.set(scaling[0], scaling[1], scaling[2],);
    sword_model.position.set(rel_pos[0], rel_pos[1], rel_pos[2]);
    sword.position.set(positions[0], positions[1], positions[2]);
    sword.add(sword_model);
    sword_model.rotation.set(THREE.MathUtils.degToRad(degrees[0]), THREE.MathUtils.degToRad(degrees[1]), THREE.MathUtils.degToRad(degrees[2]));
    
    // Debug
    /*sword.add(new THREE.AxesHelper(2));
    const debug_geo = new THREE.SphereGeometry(0.01);
    const debug_mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const pivot_marker = new THREE.Mesh(debug_geo, debug_mat);
    sword.add(pivot_marker);*/
    
    // Adding metadata to trigger the animation of showing from inventory
    sword.userData.showingFromInventoryAnimation = true;
    sword.userData.showingFromInventoryTime = 0;
    sword.userData.showingFromInventoryDuration = 0.5;
}

function move_animation_sword()
{
    if ( sword.userData.showingFromInventoryAnimation ) return;
    
    const speed = 0.05;

    if ( is_walking && !is_sprinting )
    {
        // Target values when is walking
        const target_rot_x = THREE.MathUtils.degToRad(5);
        const target_rot_y = THREE.MathUtils.degToRad(0);
        const target_rot_z = THREE.MathUtils.degToRad(-10);

        // Linear interpolation
        sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, target_rot_x, speed);
        sword.rotation.y = THREE.MathUtils.lerp(sword.rotation.y, target_rot_y, speed);
        sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, target_rot_z, speed);
        
        // Calculating the oscillation and adding to the axis
        const oscillationAmplitude = THREE.MathUtils.degToRad(5);
        const oscillationSpeed = 10;
        const oscillation = Math.sin(clock.getElapsedTime() * oscillationSpeed) * oscillationAmplitude;
        const sprint_target_rot_z = THREE.MathUtils.degToRad(-10) + oscillation;
        const sprint_target_rot_x = THREE.MathUtils.degToRad(5) + oscillation;
        sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, sprint_target_rot_z, speed);
        sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, sprint_target_rot_x, speed);
    }
    else if (is_sprinting) 
    {
        // Target values when is sprinting
        const target_rot_x = THREE.MathUtils.degToRad(0);
        const target_rot_y = THREE.MathUtils.degToRad(0);
        const target_rot_z = THREE.MathUtils.degToRad(0);

        // Linear interpolation
        sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, target_rot_x, speed);
        sword.rotation.y = THREE.MathUtils.lerp(sword.rotation.y, target_rot_y, speed);
        sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, target_rot_z, speed);
    } 
    else
    {
        // Idle mode
        const target_rot_x = THREE.MathUtils.degToRad(0);
        const target_rot_y = THREE.MathUtils.degToRad(0);
        const target_rot_z = THREE.MathUtils.degToRad(-30);
        
        sword.rotation.z = THREE.MathUtils.lerp(sword.rotation.z, target_rot_z, speed);
        sword.rotation.y = THREE.MathUtils.lerp(sword.rotation.y, target_rot_y, speed);
        sword.rotation.x = THREE.MathUtils.lerp(sword.rotation.x, target_rot_x, speed);
    }
}

function fight_animation_sword(delta) 
{
    if (!sword_model || !sword || is_defending ) return;

    if ( is_fighting ) // The key is pressed
    {
        swordAnimationTime += delta;

        var t;
        if ( sword.userData.special_ability )
            t = 2 * swordAnimationTime / swordAnimationDuration;
        else
            t = swordAnimationTime / swordAnimationDuration;

        t = Math.min(t, 1);

        // The current phase is terminated
        if (t >= 1) 
        {
            if ( is_returning ) // The key has been released
            {
                is_fighting = false;
                is_returning = false;
                swordDirection = 1;
            }

            // When the direction is 1, it means that an hit has been done
            if ( swordDirection == 1 )
            {
                // If there is one target metin then we have an hit on it.
                // We spawn the monsters associated to the metin
                if ( target_metin )
                {
                    perform_hit_metin(target_metin);
                    shake_metin(target_metin);
                    spawn_monster(target_metin);
                }

                // If there is one monster hittable
                catch_target_monster();
            }

            swordAnimationTime = 0;
            swordDirection *= -1;
            return; // To avoid graphic glitches
        }

        // easeOutQuad
        const eased_t = 1 - (1 - t) * (1 - t);

        const from = swordDirection > 0 ? swordKeyframes[0] : swordKeyframes[1];
        const to   = swordDirection > 0 ? swordKeyframes[1] : swordKeyframes[0];

        sword.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[0]), THREE.MathUtils.degToRad(to[0]), eased_t);
        sword.rotation.y = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[1]), THREE.MathUtils.degToRad(to[1]), eased_t);
        sword.rotation.z = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[2]), THREE.MathUtils.degToRad(to[2]), eased_t);
    }
}


/* --------------------------------- METIN MANAGEMENT -------------------------------- */
function add_highlight_circle(metin)
{
    // If the metin is not already highlighted we create the circle, otherwise we rotate it
    if (metin.userData.highlightCircle)
    {
        // Updating the life bar
        DM.updateMetinHealth(metin.userData.life, metin.userData.maxLife);
        return;
    }

    // Creation of the circle highlighter
    var geometry;
    if (circle_modality == 0)
        geometry = new THREE.RingGeometry(1, 1.1, 100);
    else
        geometry = new THREE.RingGeometry(210, 215, 100);

    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geometry, material);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.05;
    metin.add(circle);
    metin.userData.highlightCircle = circle;
    metin.rotation.y = 0;
    metin.userData.rotationSpeed = 2; // Speed of rotation

    // Creation of the message in the message dialog
    DM.showNewMessage("[SPACE] attack the metin");
}

function remove_highlight_circle(metin) 
{
    // If the metin is highlighted
    if (metin.userData.highlightCircle) 
    {
        metin.remove(metin.userData.highlightCircle);
        metin.userData.highlightCircle.geometry.dispose();
        metin.userData.highlightCircle.material.dispose();
        delete metin.userData.rotationSpeed;
        delete metin.userData.rotationY;
        delete metin.userData.highlightCircle;

        // Hide the metin health bar
        DM.hideMetinHealth();

        // Remove the message from message dialog
        DM.clearMessageDialog();
    }
}

function highlight_nearest_metin()
{
    // No metins are spawned
    if (!metins.length) return;

    // Player position
    const playerPos = camera.position;
    
    let minDist = Infinity;
    let nearestMetin = null;

    // Find the nearest metin
    for (const metin of metins)
    {
        const dist = metin.position.distanceTo(playerPos);
        if (dist < minDist) 
        {
            minDist = dist;
            nearestMetin = metin;
        }
    }

    const treshold = 4;

    // Adding the circle if the distance from the metin is in the treshold
    if ( minDist < treshold )
    {
        add_highlight_circle(nearestMetin);
        target_metin = nearestMetin;
    }
    else if ( nearestMetin )
    {
        remove_highlight_circle(nearestMetin);
        target_metin = undefined;
    }
}

function check_fov_metin(metin)
{
    // Max distance and degrees
    const max_angle_deg = 60;

    // Camera direction (player's visual)
    const camera_direction = new THREE.Vector3();
    const cm = camera.position.clone(); cm.y = 0;
    camera.getWorldDirection(camera_direction);

    // Computing the direction and the distance, and checking that 
    // the distance is not too high
    const to_metin = new THREE.Vector3().subVectors(metin.position, cm);
    to_metin.y = cm.y;
    to_metin.normalize();

    // The hit succeeds only if the angle is not to high
    const angle_rad = camera_direction.angleTo(to_metin);
    const angle_deg = THREE.MathUtils.radToDeg(angle_rad);

    if (angle_deg <= max_angle_deg)
        return true;
    else
        return false;
}

function perform_hit_metin(metin)
{
    // We have to check that the metin is in the visual field of the player
    if ( !check_fov_metin(metin) ) return;
    
    // Get the current stats of the player. The damage depends on it
    var stats = DM.getCurrentStats();

    // Defense of the metin
    const def_metin = CONFIG.metin_def_additive_term + CONFIG.current_level * CONFIG.metin_def_coefficient;

    // Damage calculation
    const coeff_int = 0.6;
    const random_factor = 0.9 + Math.random() * 0.2; // in [0.9, 1.1]
    var final_damage = ((stats[3] * coeff_int + stats[0]) * random_factor) - def_metin;

    // If the special ability of the sword is active then we double the damage
    if ( sword.special_ability )
        final_damage = 2 * final_damage;

    // Decrease life
    metin.userData.life -= final_damage;

    // If it is the first hit we have to replace the minimap marker
    if ( !metin.userData.hit )
    {
        metin.userData.hit = true;
        update_marker_metin(metin);
    }

    // Compute scale ratio based on life
    const lifeRatio = Math.max(0.2, metin.userData.life / metin.userData.maxLife); // minimum 20%
    const targetScale = metin.userData.originalScale.clone().multiplyScalar(lifeRatio);

    // At each hit we span debris to get a realistic effect
    spawn_metin_debris(metin);

    // Smooth scaling using lerp
    metin.scale.lerp(targetScale, 0.1); // 0.1 is smoothing factor

    // If the life is 0, then we remove the metin from the scene
    if (metin.userData.life <= 0)
    {
        scene.remove(metin);
        remove_highlight_circle(metin); // Remove the highlight circle if present
        solid_objects = solid_objects.filter(m => m !== metin); // Remove from the array
        target_metin = undefined; // Reset the target metin

        // Set the flag to the monsters associated to it, in order to destroy them
        for ( const m of spawned_mob )
        {
            if ( m.userData.associatedMetin == metin )
                trigger_monster_explosion(m);
        }

        // If the metin is not the final metin then we continue in the game
        if ( metin != final_metin_model )
        {
            // Remove from the array
            metins = metins.filter(m => m !== metin);

            // Adding to metin to be destroyed
            metin_toBeDestroyed.push(metin);

            // Remove the marker from the minimap
            remove_marker_object(metin);

            // Spawn a new coin in corrispondence of the metin position
            spawn_reward(metin.position);

            // Updating the intelligence of the player
            DM.updateInt(stats[3] + 1);

            // Removing all the debris
            for ( const debris of metin.userData.debris_array )
            {
                scene.remove(debris);
                metin.userData.debris_array.filter(o => o !== debris);
            }

            // Spawning the fragments of the metin
            spawn_metin_fragments(metin);

        }
        else // Here we have destroyed the final metin
            trigger_win();
    }
}

function shake_metin(metin) 
{
    if ( !metin ) return;
    
    // Setting animation parameter    
    metin.userData.shake_duration = 0.2; 
    metin.userData.shake_elapsed = 0;    
    metin.userData.shake_origin = metin.position.clone();

    // Update the emissive o crack in the metin
    update_emissive_intensity(metin);
}

function animate_shaking_metin(delta)
{
    // Check if there are monster currently being hitted
    for (const metin of metins) 
    {
        // If this flag does not exists, the monster can be skipped
        if ( !metin.userData.shake_duration ) continue;

        if (metin.userData.shake_duration > 0) 
        {
            // Time calculations
            metin.userData.shake_elapsed += delta;
            const remaining = metin.userData.shake_duration - metin.userData.shake_elapsed;

            // The monster can return to the original position
            if (remaining <= 0) 
            {
                metin.position.copy(metin.userData.shake_origin);
                delete metin.userData.shake_duration;
                delete metin.userData.shake_elapsed;
                delete metin.userData.shake_origin;
                continue;
            }

            // Shaking animation 
            const intensity = 0.1;
            const frequency = 10;
            const t = metin.userData.shake_elapsed;
            const decay = remaining / metin.userData.shake_duration;

            // Additive terms
            const offset_x = Math.sin(t * frequency * 2 * Math.PI) * intensity * decay;
            const offset_z = Math.cos(t * frequency * 2 * Math.PI) * intensity * decay;
            metin.position.set(
                metin.userData.shake_origin.x + offset_x,
                metin.userData.shake_origin.y,
                metin.userData.shake_origin.z + offset_z
            );
        }
    }
}

function update_emissive_intensity(metin) 
{
    const minIntensity = 2;
    const maxIntensity = 50;

    // Updating the emissive intesity of the emissive metin's map
    // to simulate damage on the metin based on the current health of it
    let damageRatio = 1 - metin.userData.life / metin.userData.maxLife;
    let intensity = minIntensity + damageRatio * (maxIntensity - minIntensity);
    metin.userData.emissive_materials.forEach(material => {
        material.emissiveIntensity = intensity;
        material.needsUpdate = true;
    });
}

function create_metin_debris(metin) 
{
    // Create debris with a strange mesh and small radius
    // Random shapes to simulate fragments
    const shape_type = Math.floor(Math.random() * 3);
    
    // Geometry of the fragment
    let geometry;
    switch (shape_type)
    {
        case 0:
            geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            break;
        case 1:
            geometry = new THREE.ConeGeometry(0.05, 0.1, 6);
            break;
        case 2:
            geometry = new THREE.TetrahedronGeometry(0.07);
            break;
    }
    
    const material = new THREE.MeshStandardMaterial({
        map: metin_texture,
        metalness: 0.5,
        emissiveMap: crack_texture,
        emissive: new THREE.Color(metin.userData.emissiveColor),
        emissiveIntensity: 50,
    });

    return new THREE.Mesh(geometry, material);
}

function spawn_metin_debris(metin) 
{
    const debris_count = 10;

    // Creating the debris array if it's the first time
    // the metin has debris
    if ( !metin.userData.debris_array )
        metin.userData.debris_array = [];
    
    for (let i = 0; i < debris_count; i++)
    {
        const debris = create_metin_debris(metin);

        // Associating the starting position of the debris as the metin
        // position. Moreover, we associate a random velocity and a random
        // rotation speed
        debris.position.copy(metin.position);
        debris.userData.origin_position = metin.position.clone();

        debris.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 3 + 3,
            (Math.random() - 0.5) * 3
        );
        debris.userData.gravity = new THREE.Vector3(0, -9.81, 0);

        debris.userData.rotation_speed = new THREE.Vector3(
            Math.random() * 2,
            Math.random() * 2,
            Math.random() * 2
        );

        // Animation parameter to simulate falling of the debris
        debris.userData.time = 0;

        // Adding the debris to the scene and saving in the associated
        // array into the metin
        scene.add(debris);
        metin.userData.debris_array.push(debris);
    }
}

function update_metin_debris(delta)
{
    // Analyzing all the metins which have debris to be animated
    for ( const metin of metins )
    {
        // We have to animate debris if they exists
        if ( !metin.userData.debris_array || metin.userData.debris_array.length == 0 ) continue;

        // Animatying each debris of the metin
        for ( const debris of metin.userData.debris_array )
        {
            // Updating time variable
            debris.userData.time += delta;
            const t = debris.userData.time;
            
            // Updating the position as the gravity force
            // p = p_0 + v_0 * t - 1/2 * g * t^2
            const velocity_term = debris.userData.velocity.clone().multiplyScalar(t);
            const gravity_term = debris.userData.gravity.clone().multiplyScalar(0.5 * t * t);
            const new_position = debris.userData.origin_position.clone().add(velocity_term).add(gravity_term);
            debris.position.copy(new_position);

            // Updating the rotation of the debris
            debris.rotation.x += debris.userData.rotation_speed.x * delta;
            debris.rotation.y += debris.userData.rotation_speed.y * delta;
            debris.rotation.z += debris.userData.rotation_speed.z * delta;

            // Removing the debris
            if (debris.position.y <= 0)
            {
                scene.remove(debris);
                metin.userData.debris_array.filter(o => o !== debris);
            }
        }
    }
}

function spawn_metin_fragments(metin) 
{
    // We can execute this function if we have in memory the model of the fragment
    if ( !fragment_metin_model_flag ) return;
    
    const fragment_count = 4;

    // Creating the debris array if it's the first time
    // the metin has debris
    if ( !metin.userData.fragment_array )
        metin.userData.fragment_array = [];
    
    for (let i = 0; i < fragment_count; i++)
    {
        // Generate a fragment of the metin
        const fragment = fragment_metin_model.clone();
        fragment.scale.set(1,1,1);
        fragment.traverse(child => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    map: metin_texture,
                    metalness: 0.5,
                    emissiveMap: crack_texture,
                    emissive: new THREE.Color(metin.userData.emissiveColor),
                    emissiveIntensity: 50,
                });

                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Associating the starting position of the fragment as the metin
        // position, with a small offset
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            1 + Math.random(),
            (Math.random() - 0.5) * 1.5
        );
        fragment.position.copy(metin.position).add(offset);
        fragment.userData.origin_position = fragment.position.clone();
        fragment.userData.startScale = new THREE.Vector3(1,1,1);
        
        // Animation parameter to simulate falling of the fragment with the gravity force
        fragment.userData.gravity = new THREE.Vector3(0, -9.81, 0);
        fragment.userData.time = 0;
        
        // Adding the fragments to the scene and saving in the associated
        // array into the metin
        scene.add(fragment);
        metin.userData.fragment_array.push(fragment);
    }
}

function update_metin_fragments(delta)
{
    // Analyzing all the metins which have fragments to be animated
    for ( const metin of metin_toBeDestroyed )
    {
        // We have to animate debris if they exists
        if ( !metin.userData.fragment_array ) continue;

        // Animatying each fragment of the metin
        for ( const fragment of metin.userData.fragment_array )
        {
            // Updating time variable
            fragment.userData.time += delta;
            const t = fragment.userData.time;
            
            // Updating the position as the gravity force
            // p = p_0 + v_0 * t - 1/2 * g * t^2
            const gravity_term = fragment.userData.gravity.clone().multiplyScalar(0.5 * t * t);
            const new_position = fragment.userData.origin_position.clone().add(gravity_term);
            fragment.position.copy(new_position);
            
            // The fragment has reached the ground
            if (fragment.position.y <= 0)
            {
                fragment.position.set(fragment.position.x, 0, fragment.position.z);
                
                // Removing from the array (not from the scene!!)
                metin.userData.fragment_array.filter(o => o !== fragment);
            }
        }

        // When this happens, it means that all the fragments have reached the ground.
        // Now, we can remove from the array
        if ( metin.userData.fragment_array.length == 0 )
            metin_toBeDestroyed.filter(o => o !== metin);
    }
}


/* ------------------------------ DEFENSE MANAGEMENT ----------------------------------- */
function defense_animation_sword(delta)
{
    if ( !sword_model || !sword ) return;

    if ( is_defending ) // The key is pressed
    {
        // Computing the percentage
        swordAnimationTimeDefending += delta;
        let t = swordAnimationTimeDefending / swordAnimationDurationDefending;
        t = Math.min(t, 1);

        // easeOutQuad
        const eased_t = 1 - (1 - t) * (1 - t);
        const from = swordKeyframesDefense[0];
        const to   = swordKeyframesDefense[1];

        sword.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[0]), THREE.MathUtils.degToRad(to[0]), eased_t);
        sword.rotation.y = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[1]), THREE.MathUtils.degToRad(to[1]), eased_t);
        sword.rotation.z = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[2]), THREE.MathUtils.degToRad(to[2]), eased_t);
    }
    else if ( is_returning_defense )
    {
        // Computing the percentage
        swordAnimationTimeDefending += delta;
        let t = swordAnimationTimeDefending / swordAnimationDurationDefending;
        t = Math.min(t, 1);

        // easeOutQuad
        const eased_t = 1 - (1 - t) * (1 - t);
        const from = swordKeyframesDefense[1];
        const to   = swordKeyframesDefense[0];

        sword.rotation.x = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[0]), THREE.MathUtils.degToRad(to[0]), eased_t);
        sword.rotation.y = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[1]), THREE.MathUtils.degToRad(to[1]), eased_t);
        sword.rotation.z = THREE.MathUtils.lerp(THREE.MathUtils.degToRad(from[2]), THREE.MathUtils.degToRad(to[2]), eased_t);

        if ( t >= 1 )
        {
            swordAnimationTimeDefending = 0;
            is_returning_defense = false;
        }
    }
}

function check_hit_defense(spell)
{
    // If the player is currently defending
    if ( !is_defending ) return false;
    
    // Max degrees
    const max_angle_deg = 60;

    // Camera direction (player's visual)
    const camera_direction = new THREE.Vector3();
    const cm = camera.position.clone(); cm.y = 0;
    camera.getWorldDirection(camera_direction);

    // Computing the direction from the camera to the spell
    const to_spell = new THREE.Vector3().subVectors(spell.position, cm);
    to_spell.y = cm.y;
    
    // The hit succeeds only if the angle is not to high
    const angle_rad = camera_direction.angleTo(to_spell);
    const angle_deg = THREE.MathUtils.radToDeg(angle_rad);

    if (angle_deg <= max_angle_deg)
        return true;
    else
        return false;
}

function create_shield()
{
    // If the shield already exists we don't have to do anything
    if ( camera.userData.shield ) return;

    // If the value of the shield is not max we cannot create the shield
    if ( camera.userData.currentValueShield && camera.userData.currentValueShield < CONFIG.init_shield ) return;

    // Creating the geometry and the material of the shield as a semi-sphere or radius 3
    const geometry = new THREE.SphereGeometry(3, 32, 16, 0, 2*pi, 0, pi/2);
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x9988cc,
        transparent: true,
        opacity: 0.2,
        roughness: 0,
        metalness: 0.1,
        transmission: 1,
        thickness: 0.7,
        side: THREE.DoubleSide
    });

    // Creating the shield
    const shield = new THREE.Mesh(geometry, material);
    shield.position.set(camera.position.x, 0, camera.position.z);
    shield.scale.set(0.01, 0.01, 0.01);
    scene.add(shield);

    // Starting the animation of spawning and attaching to the camera
    shield.userData.animationSpawning = true;
    shield.userData.animationTime = 0;
    shield.userData.animationDuration = 0.3;
    camera.userData.shield = shield;
    camera.userData.shieldRadius = 3;
    camera.userData.currentValueShield = CONFIG.init_shield;
    camera.userData.rechargingPhaseShield = false;
}

function animate_spawn_shield(delta)
{
    // Getting the shield from the camera data
    const shield = camera.userData.shield;
    
    // If the shield exists and it is spawning
    if ( shield && shield.userData.animationSpawning ) 
    {
        // Scaling up the shield
        shield.userData.animationTime += delta;
        const t = Math.min(shield.userData.animationTime / shield.userData.animationDuration, 1);
        shield.scale.setScalar(t);

        if (t >= 1)
        {
            shield.userData.animationSpawning = false;
            camera.userData.shieldActive = true;
        }
    }
}

function remove_shield()
{
    // If the shield doesn't already exists we don't have to do anything
    if ( !camera.userData.shield ) return;

    // Triggering the shield despawn
    camera.userData.shieldActive = false;
    camera.userData.rechargingPhaseShield = true;
    camera.userData.shield.userData.animationSpawning = false;
    camera.userData.shield.userData.animationDespawning = true;
    camera.userData.shield.userData.animationTime = 0;
    camera.userData.shield.userData.animationDuration = 0.3;
}

function animate_despawn_shield(delta)
{
    // Getting the shield from the camera data
    const shield = camera.userData.shield;

    // If the shield exists and it is spawning
    if ( shield && shield.userData.animationDespawning ) 
    {
        // Scaling down the shield
        shield.userData.animationTime += delta;
        const t = Math.min(shield.userData.animationTime / shield.userData.animationDuration, 1);
        const scale = 1 - t;
        shield.scale.setScalar(scale);

        if (t >= 1)
        {
            shield.userData.animationDespawning = false;

            // Removing the shield
            scene.remove(shield);
            camera.userData.shield = undefined;
        }
    }
}

function animate_following_shield(delta)
{
    // Get access to the shield and update its position
    if ( camera.userData.shield )
        camera.userData.shield.position.set(camera.position.x, 0, camera.position.z);

    // Get current stats
    const stats = DM.getCurrentStats();

    // Shield variables
    const shield_drain_rate = get_shield_drain_rate(parseInt(stats[3]));
    const shield_regen_rate = get_shield_regen_rate(parseInt(stats[3]));

    if ( camera.userData.currentValueShield == undefined ) return;

    // Updating the shield value
    if ( camera.userData.shieldActive )
    {
        camera.userData.currentValueShield -= shield_drain_rate * delta;
        camera.userData.currentValueShield = Math.max(0, camera.userData.currentValueShield);

        // If the shield is terminated starting the recharging phase
        if ( camera.userData.currentValueShield <= 0 )
            remove_shield();
    }
    else if ( camera.userData.rechargingPhaseShield )
    {
        camera.userData.currentValueShield += shield_regen_rate * delta;
        camera.userData.currentValueShield = Math.min(CONFIG.init_shield, camera.userData.currentValueShield);

        // Signal the termination of recharging phase
        if ( camera.userData.currentValueShield >= CONFIG.init_shield )
            camera.userData.rechargingPhaseShield = false;
    }
    
    DM.updateShield(camera.userData.currentValueShield, CONFIG.init_shield);
}

function check_spell_shield_collision(spell)
{
    // If the shield doesn't exists we don't have to do anything
    if ( !camera.userData.shield || !camera.userData.shieldActive ) return;

    // Getting the current parameters
    const shield_pos = camera.userData.shield.position;
    const shield_radius = camera.userData.shieldRadius;

    // Computing the distances between:
    // spell and center shield (player)
    // spell origin and center shield (player)
    const distance = spell.position.distanceTo(shield_pos);
    const origin_distance = spell.userData.origin.distanceTo(shield_pos);

    // We have a collision when the spell is inside the shield (distance < shield radius)
    // and the spell weren't casted into the shield (origin distance > shield radius)
    if (distance < shield_radius && origin_distance > shield_radius)
    {
        // Computing the normal to the impact
        const normal = new THREE.Vector3().subVectors(spell.position, shield_pos).normalize();

        // Get the current velocity of the spell
        let current_velocity = spell.userData.velocity;
        
        // Reflecting the direction
        // with this formula v − 2⋅(v dot n) dot n
        // In our case, with the spell which follows the player, it will be the negate of the
        // impact direction
        const reflected_direction = current_velocity.clone().reflect(normal).normalize();

        // Reducing the velocity to simulate the energy dissipation
        //spell.userData.speed = spell.userData.speed * 0.8;
        spell.userData.speed = Math.max(spell.userData.speed * 0.8, 0.5);

        // Setting the new velocity
        spell.position.add(normal.clone().multiplyScalar(0.1));
        spell.userData.velocity = reflected_direction.multiplyScalar(spell.userData.speed);
        
        // Now we're signalling that the spell has hit the shield. The dynamics change
        // The spell must not follow the player anymore
        spell.userData.hitShield = true;

        // Starting the hit animation on the shield
        camera.userData.shield.userData.hitVibration = {
            time: 0,
            duration: 1,
            strength: 1
        };
    }
}

function animate_shield(delta) 
{
    // If exists the shield and it is vibrating
    const shield = camera.userData.shield;
    if ( !shield || !shield.userData.hitVibration ) return;

    // Updating the time
    const vib = shield.userData.hitVibration;
    vib.time += delta;

    // If the animation is not ended
    if (vib.time < vib.duration) 
    {
        // Computing a random vibration with attenuation
        const offset = vib.strength * (1 - vib.time / vib.duration);
        shield.position.x += (Math.random() - 0.5) * offset;
        shield.position.y += (Math.random() - 0.5) * offset;
        shield.position.z += (Math.random() - 0.5) * offset;
    }
    else // Animation ended 
    {
        // Removing the effect 
        delete shield.userData.hitVibration;
        shield.position.copy(camera.position);
    }
}

function get_shield_drain_rate(intelligence) 
{
    // INT 0  => holds 10s  (100 / 10)
    // INT 20 => holds 60s  (100 / 1.66)
    const maxDuration = 60; // seconds
    const minDrainPerSecond = 100 / maxDuration; // 1.66
    const maxDrainPerSecond = 10; // dura solo 10s con INT 0

    const drain = maxDrainPerSecond - intelligence * ((maxDrainPerSecond - minDrainPerSecond) / 20);
    return Math.max(minDrainPerSecond, drain);
}

function get_shield_regen_rate(intelligence) 
{
    // INT 0  => 20s of recharge (100 / 5)
    // INT 20 => 5s of recharge (100 / 20)
    const maxRegenPerSecond = 20;
    const minRegenPerSecond = 5;

    const regen = minRegenPerSecond + intelligence * ((maxRegenPerSecond - minRegenPerSecond) / 20);
    return Math.min(minRegenPerSecond, regen);
}


/* ------------------------------- SPECIAL ABILITY MANAGEMENT --------------------------- */
function activate_special_ability()
{
    // The sword must exists and the ability must not be already active
    if ( !sword || sword.userData.special_ability ) return;

    // Check if the ability can be activated
    if ( !ability_activable ) return;

    // The ability now is running
    cool_down_phase = false;
    ability_activable = false;
    last_starting_ability = clock.getElapsedTime();

    // Remove from the inventory the entry for special ability
    DM.showHideAbilityInventory(0);
    
    // Parameters of the animation
    const particle_radius = 0.02;
    
    // Specific parameters of the sword
    const index = sword.children[0].userData.n - 1;
    const radius = sword_ability_parameters[index].radius;
    const max_height = sword_ability_parameters[index].max_height;

    // Creation of the particles and adding to the sword
    const particle_geometry = new THREE.SphereGeometry(particle_radius, 8, 8);
    const particle_material1 = new THREE.MeshBasicMaterial({
        color: CONFIG.sword_stats[index].color_trail1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particle_material2 = new THREE.MeshBasicMaterial({
        color: CONFIG.sword_stats[index].color_trail2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particle1 = new THREE.Mesh(particle_geometry.clone(), particle_material1.clone());
    const particle2 = new THREE.Mesh(particle_geometry.clone(), particle_material2.clone());
    sword.add(particle1);
    sword.add(particle2);

    // Trail material
    const trail_material1 = new THREE.MeshBasicMaterial({
        color: CONFIG.sword_stats[index].color_trail1,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const trail_material2 = new THREE.MeshBasicMaterial({
        color: CONFIG.sword_stats[index].color_trail2,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    // Initial curve. To build the curve we must have at least 2 points
    const initial_curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.001, 0)
    ]);
    const trail_geometry1 = new THREE.TubeGeometry(initial_curve, 10, particle_radius, 8, false);
    const trail_geometry2 = new THREE.TubeGeometry(initial_curve, 10, particle_radius, 8, false);

    const trail_mesh1 = new THREE.Mesh(trail_geometry1, trail_material1.clone());
    const trail_mesh2 = new THREE.Mesh(trail_geometry2, trail_material2.clone());
    sword.add(trail_mesh1);
    sword.add(trail_mesh2);

    // Setting animation parameters
    sword.userData.special_ability = {
        particles: [particle1, particle2],
        trails: [[], []],              // array of trail points per particle
        trail_meshes: [trail_mesh1, trail_mesh2],
        time: 0,
        duration: CONFIG.sword_stats[index].duration_special_ability,
        toFinish: false,
        radius: radius,
        max_height: max_height
    };
}

function animate_particles(delta)
{
    // The sword must exists and the ability must be active to be animated
    if (!sword || !sword.userData.special_ability ) return;

    // Notify that the ability is active
    DM.highlightSpecialAbility(sword.children[0].userData.n_into_inventory, 1);
    
    // Updating the time
    const ability = sword.userData.special_ability;
    ability.time += delta;
    const t = ability.time;

    // Timeout expired; we let complete the current run and then we will remove
    if (t > ability.duration) 
        ability.toFinish = true;
    
    // Movement parameters
    const angular_speed = 6.0;
    const vertical_speed = 0.5;
    const radius = ability.radius;
    const max_height = ability.max_height;

    // We update both particles and trails
    for (let i = 0; i < 2; i++) 
    {
        // Updating the position
        const angle = t * angular_speed + i * pi;  // The 2 particles are opposite
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (t * vertical_speed) % max_height;

        // Reset trail when the run is finished (we avoid to connect opposite points)
        if (y < 0.01)
            ability.trails[i] = [];
        
        // Animation terminated
        if (y < 0.01 && ability.toFinish && ability.trails[i].length === 0) 
        {
            sword.remove(ability.particles[i]);
            sword.remove(ability.trail_meshes[i]);
            continue;
        }

        // Updating the particle position
        ability.particles[i].position.set(x, y, z);

        // Updating life of the point already recorded and deleting of the ones with life < 0
        for (const point of ability.trails[i])
            point.life -= delta * 0.3; 
        ability.trails[i] = ability.trails[i].filter(p => p.life > 0);

        // Recording the new particle position
        ability.trails[i].push({
            position: new THREE.Vector3(x, y, z),
            life: 1.0 // Life of the point, to simulate the trail
        });

        // When we have at least 2 point to draw the curve
        if (ability.trails[i].length >= 2) 
        {
            // Building the new curve and the new geometry
            // It is composed by different point rather than the previous one
            const curve = new THREE.CatmullRomCurve3(
                ability.trails[i].map(p => p.position.clone())
            );

            const new_geometry = new THREE.TubeGeometry(
                curve,
                ability.trails[i].length * 2,
                0.02,  // spessore scia
                8,
                false
            );

            // Substituting the previous geometry with the new one
            ability.trail_meshes[i].geometry.dispose();
            ability.trail_meshes[i].geometry = new_geometry;

            // Opacity based on the oldest point in the trail
            const oldest_life = Math.min(...ability.trails[i].map(p => p.life));
            ability.trail_meshes[i].material.opacity = oldest_life * 0.4;
            ability.trail_meshes[i].material.needsUpdate = true;
        }
    }

    // Final removal when both trails are empty
    if ( ability.toFinish && ability.trails[0].length === 0 && ability.trails[1].length === 0 )
    {
        sword.userData.special_ability = null;
        cool_down_phase = true; // Start the cooldown phase from now
        last_activation_ability = clock.getElapsedTime();
        DM.highlightSpecialAbility(sword.children[0].userData.n_into_inventory, 0);
    }     
}

function check_special_ability()
{
    // The sword must be loaded
    if ( !sword ) return;

    // Check if the ability for the current sword can be activated
    const index = sword.children[0].userData.n - 1;
    const stats = CONFIG.sword_stats[index];

    // If the ability can be activated we show the bar in the stats and we update that
    if ( parseInt(DM.getCurrentStats()[3]) >= stats.intelligence_special_ability )
    {
        DM.showSpecialAbilityStats(1);
        
        if ( cool_down_phase )
            DM.updateAbility((clock.getElapsedTime() - last_activation_ability), stats.cooldown_special_ability);
        else
            DM.updateAbility(stats.duration_special_ability - (clock.getElapsedTime() - last_starting_ability), stats.duration_special_ability);

        // Verify if the cooldown is respected and the intelligence is sufficient
        if ( cool_down_phase && clock.getElapsedTime() - last_activation_ability > stats.cooldown_special_ability )
        {
            // Notify the player about the possibility to activate it
            // The notification must happen only when we notice for the first time
            // that the ability can be activated
            if ( !ability_activable )
                DM.showHideAbilityInventory(1);

            ability_activable = true;
        }
    }
    else
    {
        DM.showSpecialAbilityStats(0);
        DM.showHideAbilityInventory(0);
        ability_activable = false;
    }
}


/* ------------------------------ INVENTORY MANAGEMENT ---------------------------------- */
// Sword item
function load_item_sword()
{
    // If there is one sword item not collected it will be removed from the scene
    if ( sword_item )
    {
        scene.remove(sword_item);
        sword_item = undefined;
    }
    
    // Load the model of the sword droppable
    switch ( next_sword_droppable )
    {
        case 2:
            // Load the model of the new sword and create the item
            UTILITY.loadGLBModel("sword_model_2.glb", (model) => {
                sword_item = model; 
                sword_item_flag = true; 
                sword_item.userData.n = 2;
            });
            break;
        
        case 3:
            // Load the model of the new sword and create the item
            UTILITY.loadGLBModel("sword_model_3.glb", (model) => {
                sword_item = model; 
                sword_item_flag = true; 
                sword_item.userData.n = 3;
            });
            break;
    }
}

function show_item_sword()
{
    if ( !sword_item_flag ) return;

    // Only the first time
    sword_item_flag = false;  

    // Setting the animation parameters
    sword_item.scale.set(0.75, 0.75, 0.75);
    sword_item.userData.animationActive = true;
    sword_item.userData.animationDuration = 1;
    sword_item.userData.timeAnimation = 0;
    sword_item.userData.highlighted = false;
    sword_item.userData.gravity = -9.8;
    sword_item.position.set( chest_model.position.x, chest_model.position.y + 1, chest_model.position.z );
    sword_item.userData.startPos = [chest_model.position.x, chest_model.position.y + 1, chest_model.position.z];
    sword_item.userData.velocity = new THREE.Vector3(0, 3, 3);

    scene.add(sword_item);
}

function animate_spawning_item_sword(delta)
{
    if ( !sword_item || !sword_item.userData.animationActive ) return;

    // Updating velocity
    sword_item.userData.timeAnimation += delta;
    
    // Computing the position
    const new_y = sword_item.userData.startPos[1] + sword_item.userData.velocity.y * sword_item.userData.timeAnimation + 
                        0.5 * sword_item.userData.gravity * sword_item.userData.timeAnimation * sword_item.userData.timeAnimation;
    
    const new_z = sword_item.userData.startPos[2] + sword_item.userData.velocity.z * sword_item.userData.timeAnimation;
    
    // Updating the position
    sword_item.position.set(sword_item.userData.startPos[0], new_y, new_z);

    // Stop the animation when needed
    if (sword_item.position.y < 0.5) 
    {
        sword_item.position.y = 0.5;
        sword_item.userData.animationActive = false;
        items.push(sword_item);
    }
}

function highlight_nearest_item()
{
    // No sword item is spawned
    if ( !sword_item ) return;

    // Player position
    const playerPos = camera.position;
    
    // Check if the sword is near the player
    const treshold = 2;
    if ( playerPos.distanceTo(sword_item.position) < treshold )
    {
        sword_item.userData.near = true;
        highlight_item();
    }
    else
    {
        sword_item.userData.near = false;
        remove_highlight_item();
    }
}

function highlight_item()
{
    // Starting rotation of the item
    if ( sword_item && sword_item.userData.near && !sword_item.userData.animationActive )
    {
        if ( !sword_item.userData.highlighted )
        {
            sword_item.userData.highlighted = true;
            sword_item.rotation.y = 0; // Reset rotation
            sword_item.userData.rotationSpeed = 5; // Speed of rotation
        }

        DM.showNewMessage("[C] to collect the sword");

        sword_item.rotation.y += sword_item.userData.rotationSpeed * THREE.MathUtils.degToRad(1); 
    }
}

function remove_highlight_item()
{
    // If the item is highlighted, we remove the highlight
    if (!sword_item.userData.near && sword_item.userData.highlighted) 
    {
        sword_item.userData.highlighted = false;
        sword_item.userData.rotationSpeed = 0; // Stop rotation
        DM.clearMessageDialog(); // Remove the message from the dialog
    }
}

function animate_collection_item()
{
    // If the player is trying to collect the sword
    if ( sword_item.userData.near && sword_item.userData.highlighted )
    {
        // Position of the player
        const player_pos = camera.position;

        // Current position of the item
        const item_position = sword_item.position;

        // Movement direction from item to player
        const direction = new THREE.Vector3().subVectors(player_pos, item_position).normalize();

        // Move the item towards the player
        const speed = 0.1; // Speed of the item towards the player

        // If animation is not started, we start it
        if ( !collecting_animation )
            collecting_animation = true;
        else
        {
            // We update the position of the item
            sword_item.position.addScaledVector(direction, speed);

            // We scale the item to simulate collection
            sword_item.scale.multiplyScalar(0.98); // Scale down the item

            // If the item is close enough to the player, we collect it
            if ( sword_item.position.distanceTo(player_pos) < 0.5 )
            {
                add_sword_to_inventory(sword_item.clone());
                scene.remove(sword_item);
                sword_item = undefined;
                DM.clearMessageDialog();
                collecting_animation = false; // Reset the animation flag
            }
        }
    }
}

function change_sword(n_sword)
{
    // Check that the number is valid
    if ( ! (n_sword >= 1 && n_sword <= inventory.length) ) return;

    // Check that the sword is not already changing in this frame
    if ( sword.userData.showingFromInventoryAnimation ) return;

    // Removing the current sword
    camera.remove(sword);
    
    // Start the loading of the sword already present in the inventory
    sword_model = inventory[n_sword - 1];
    sword_flag = true;
    sword_number = n_sword;
    load_sword_from_inventory();

    // Updating the attack value of the sword
    DM.updateAttack(sword_model.userData.atk);
    DM.highlightCurrentSword(sword_number);

    // Updating the values for the ability
    cool_down_phase = true;
    last_activation_ability = clock.getElapsedTime();
}

function animate_showing_from_inventory(delta)
{
    // If we are switching sword
    if ( !sword || !sword.userData.showingFromInventoryAnimation ) return;

    const start_angle = [0, 50, 120];
    const end_angle = [0, 0, -60];

    // Updating the time
    sword.userData.showingFromInventoryTime += delta;
    var t = sword.userData.showingFromInventoryTime / sword.userData.showingFromInventoryDuration;
    t = Math.min(1, t);

    var current_rot_x = THREE.MathUtils.lerp(start_angle[0], end_angle[0], t);
    var current_rot_y = THREE.MathUtils.lerp(start_angle[1], end_angle[1], t);
    var current_rot_z = THREE.MathUtils.lerp(start_angle[2], end_angle[2], t);
    
    //sword.position.set(0.1, 0, -0.2);
    sword.rotation.set(THREE.MathUtils.degToRad(current_rot_x), THREE.MathUtils.degToRad(current_rot_y), 
                                                                THREE.MathUtils.degToRad(current_rot_z));

    // This happens only the first time this function is executed for the current animation
    if ( sword.userData.showingFromInventoryTime == delta )
        camera.add(sword);

    if ( t >= 1 )
        sword.userData.showingFromInventoryAnimation = false;
}

function add_sword_to_inventory(sword)
{
    // If exists the model
    if ( !sword ) return;
    
    // Get the default stats of the sword thanks to the number inside
    // Adding the model of the sword to the inventory
    // Init the values of atk and special ability
    sword.scale.set(1,1,1);
    const sword_default = CONFIG.sword_stats[sword.userData.n - 1];
    sword.name = sword_default.name;
    sword.userData.atk = sword_default.base_atk;
    inventory.push(sword);
    var n = DM.addNewEntryInventory(CONFIG.sword_stats[sword.userData.n - 1].name_inv);
    sword.userData.n_into_inventory = n;
}


/* -------------------------- REWARDS MANAGEMENT ---------------------------------- */
function spawn_reward(position)
{
    // The reward is spawned only in the first 2 levels
    if ( CONFIG.current_level == 3 ) return;
    
    // Generate a random number to exploit probability. With probability p
    // the metin drop a key, with probabily (1-p) the metin drop a coin
    let r = Math.random();

    // Here we drop a key:
    // - with probability p if no key has already spawned
    // - if all metin are destroyed.
    if ( (r < CONFIG.probability_key || metins.length == 0 ) && (collected_keys.length + spawned_keys.length) == 0) 
        spawn_new_key(position);
    else // Here we drop the coin
        spawn_new_coin(position);
}

// Coin
function spawn_new_coin(position)
{
    // Spawn the reward coin in the given position
    let new_coin = coin_model.clone();
    new_coin.position.set(position.x, 3, position.z);
    
    // Rotate the coin on the plane ZY
    new_coin.rotation.z = pi/2;
    new_coin.scale.set(1,1,1);

    // Gravity parameters
    new_coin.userData.velocityY = 0;
    new_coin.userData.minY = 1;
    spawned_coins.push(new_coin);
    scene.add(new_coin);
}

function animate_coins(delta)
{
    const gravity = -9.8; // gravity acceleration g
    
    for (const coin of spawned_coins) 
    {
        // If the coins already reached the ground we skip it
        if (coin.position.y <= coin.userData.minY)
            continue;

        // Gravity force
        coin.userData.velocityY += gravity * delta;
        coin.position.y += coin.userData.velocityY * delta;

        // Set to the min value when reached
        if (coin.position.y < coin.userData.minY) 
        {
            coin.position.y = coin.userData.minY;
            coin.userData.velocityY = 0;
        }
    }
}

function highlight_nearest_coin()
{
    // No coins are spawned
    if (!spawned_coins.length) return;

    // Player position
    const playerPos = camera.position;
    
    let minDist = Infinity;
    let nearestCoin = null;

    // Find the nearest coin
    for (const coin of spawned_coins)
    {
        const dist = coin.position.distanceTo(playerPos);
        if (dist < minDist) 
        {
            minDist = dist;
            nearestCoin = coin;
        }
    }

    const treshold = 4;
    if ( minDist < treshold )
    {
        target_coin = nearestCoin;
        highlight_coin(nearestCoin);
    }
    else
    {
        target_coin = undefined;
        remove_highlight_coin(nearestCoin);
    }
}

function highlight_coin(coin)
{
    // If the coin is the target coin we rotate it
    if ( target_coin == coin )
    {
        // Starting rotation of the coin
        if ( !coin.userData.highlighted )
        {
            coin.userData.highlighted = true;
            coin.rotation.y = 0; // Reset rotation
            coin.userData.rotationSpeed = 5; // Speed of rotation

            DM.showNewMessage("[C] collect the coin");
        }
        coin.rotation.y += coin.userData.rotationSpeed * 0.01; // Rotate the coin   
    }
}

function remove_highlight_coin(coin)
{
    // If the coin is highlighted, we remove the highlight
    if (coin.userData.highlighted) 
    {
        coin.userData.highlighted = false;
        coin.userData.rotationSpeed = 0; // Stop rotation
        DM.clearMessageDialog(); // Remove the message from the dialog
    }
}

function animate_collection_coin()
{
    // If the player is trying to collect a coin
    if ( target_coin )
    {
        // Position of the player
        const playerPos = camera.position;

        // Current position of the coin
        const coinPos = target_coin.position;

        // Movement direction from coin to player
        const direction = new THREE.Vector3().subVectors(playerPos, coinPos).normalize();

        // Move the coin towards the player
        const speed = 0.1; // Speed of the coin towards the player

        // If animation is not started, we start it
        if ( !collecting_animation )
            collecting_animation = true;
        else
        {
            // We update the position of the coin
            target_coin.position.addScaledVector(direction, speed);

            // We scale the coin to simulate collection
            target_coin.scale.multiplyScalar(0.98); // Scale down the coin

            // If the coin is close enough to the player, we collect it
            if ( target_coin.position.distanceTo(playerPos) < 0.5 )
            {
                finalize_collect_coin();
                collecting_animation = false; // Reset the animation flag
            }
        }
    }
}

function finalize_collect_coin()
{
    // Collect the coin if it is the target coin
    if ( target_coin )
    {
        scene.remove(target_coin);
        spawned_coins = spawned_coins.filter(c => c !== target_coin); // Remove from the array
        target_coin = undefined; // Reset the target coin
        DM.clearMessageDialog();

        // Update the player's stats
        let new_coins = parseInt(DM.getCurrentStats()[1]) + 1;
        DM.updateCoin(new_coins);
    }
}

// Key
function spawn_new_key(position)
{
    // Spawn the reward key in the given position
    let new_key = key_model.clone();
    new_key.position.set(position.x, 3, position.z);
    
    // Rotate the key on the plane ZY
    new_key.scale.set(0.1, 0.1, 0.1);

    // Gravity parameters
    new_key.userData.velocityY = 0;
    new_key.userData.minY = 1;
    spawned_keys.push(new_key);
    scene.add(new_key);
}

function animate_keys(delta)
{
    const gravity = -9.8; // gravity acceleration g
    
    for (const key of spawned_keys) 
    {
        // If the key already reached the ground we skip it
        if (key.position.y <= key.userData.minY)
            continue;

        // Gravity force
        key.userData.velocityY += gravity * delta;
        key.position.y += key.userData.velocityY * delta;

        // Set to the min value when reached
        if (key.position.y < key.userData.minY) 
        {
            key.position.y = key.userData.minY;
            key.userData.velocityY = 0;
        }
    }
}

function highlight_nearest_key()
{
    // No key are spawned
    if (!spawned_keys.length) return;

    // Player position
    const playerPos = camera.position;
    
    let minDist = Infinity;
    let nearestKey = null;

    // Find the nearest key
    for (const key of spawned_keys)
    {
        const dist = key.position.distanceTo(playerPos);
        if (dist < minDist) 
        {
            minDist = dist;
            nearestKey = key;
        }
    }

    const treshold = 4;
    if ( minDist < treshold )
    {
        target_key = nearestKey;
        highlight_key(nearestKey);
    }
    else
    {
        target_key = undefined;
        remove_highlight_key(nearestKey);
    }
}

function highlight_key(key)
{
    // If the key is the target key we rotate it
    if ( target_key == key )
    {
        // Starting rotation of the key
        if ( !key.userData.highlighted )
        {
            key.userData.highlighted = true;
            key.rotation.y = 0; // Reset rotation
            key.userData.rotationSpeed = 5; // Speed of rotation

            DM.showNewMessage("[C] collect the key");
        }
        key.rotation.y += key.userData.rotationSpeed * 0.01; // Rotate the key   
    }
}

function remove_highlight_key(key)
{
    // If the key is highlighted, we remove the highlight
    if (key.userData.highlighted) 
    {
        key.userData.highlighted = false;
        key.userData.rotationSpeed = 0; // Stop rotation
        DM.clearMessageDialog(); // Remove the message from the dialog
    }
}

function animate_collection_key()
{
    // If the player is trying to collect a key
    if ( target_key )
    {
        // Position of the player
        const playerPos = camera.position;

        // Current position of the key
        const keyPos = target_key.position;

        // Movement direction from key to player
        const direction = new THREE.Vector3().subVectors(playerPos, keyPos).normalize();

        // Move the key towards the player
        const speed = 0.1; // Speed of the key towards the player

        // If animation is not started, we start it
        if ( !collecting_animation )
            collecting_animation = true;
        else
        {
            // We update the position of the key
            target_key.position.addScaledVector(direction, speed);

            // We scale the key to simulate collection
            target_key.scale.multiplyScalar(0.98); // Scale down the key

            // If the key is close enough to the player, we collect it
            if ( target_key.position.distanceTo(playerPos) < 0.5 )
            {
                finalize_collect_key();
                collecting_animation = false; // Reset the animation flag
            }
        }
    }
}

function finalize_collect_key()
{
    // Collect the key if it is the target key
    if ( target_key )
    {
        scene.remove(target_key);
        spawned_keys = spawned_keys.filter(c => c !== target_key); // Remove from the array
        collected_keys.push(target_key);
        target_key = undefined; // Reset the target key
        DM.clearMessageDialog();

        // Update the player's stats
        let new_keys = parseInt(DM.getCurrentStats()[4]) + 1;
        DM.updateKey(new_keys);
    }
}


/* --------------------------- TENT ITEM MANAGEMENT --------------------------------- */
// N.B. I've noticed a very curious thing. When trying to implement the animation
// 30 raytracing tasks have success, 1 no. So we need a sort of timeout to handle this problem.
// We adopt a solution using time.
function catch_item()
{
    // Max distance variable
    const max_distance = 3;
    
    // Watching direction from camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Set the raycaster starting from our position (camera) and directed as the cameraDirection
    raycaster.set(camera.position, cameraDirection);

    // Get the intersection (also the child are involved)
    const intersects = raycaster.intersectObjects(items, true);

    // Find the object intersected
    const lookedAt = intersects.find(hit => hit.distance <= max_distance);

    // If exists the object
    if ( lookedAt )
    {
        // May happen that the intersection is with one child of the main item
        // so we select the parent item in order to apply the animation correctly
        if ( lookedAt.object.name === heart_model.name )
            watched_item = heart_model;
        else if ( lookedAt.object.name === chest_model.name )
            watched_item = chest_model;
        else if ( lookedAt.object.name === anvil_model.name )
            watched_item = anvil_model;
        else if ( lookedAt.object.name === monolith_model.name )
            watched_item = monolith_model;
        
        // Setting the parameters for the animation when the item is watched
        if ( watched_item )
        {
            // Update the message dialog
            DM.showNewMessage("[R] interact with the item");

            watched_item.userData.rotationSpeed = 2;
            watched_item.userData.startTime = clock.getElapsedTime();
            watching_item_animation = true;
        }
    }
}

function rotation_watched_item()
{
    const max_sec_duration = 0.75; // Parameters to be tuned

    // If the animation is active
    if ( watching_item_animation )
    {
        // Stop the rotation when the item has not being watched for enough time
        for ( const i of items )
        {
            if (clock.getElapsedTime() - i.userData.startTime > max_sec_duration )
            {
                // We don't implement any interpolation to avoid conflict if the item will being rewatched during the eventual
                // return in rest position
                i.rotation.y = 0; 
                if ( watched_item == i )
                {
                    watched_item = undefined;
                    DM.clearMessageDialog();
                }
            }
        }
    }
    
    // If there exists a current watched_item then we rotate it
    if ( watched_item )
        watched_item.rotation.y += watched_item.userData.rotationSpeed * 0.025;
    else
        watching_item_animation = false;
}


/* --------------------------- MONSTER MANAGEMENT --------------------------------- */
function create_blood_overlay()
{
    if ( !blood_texture_flag ) return;
    
    // Only the first time we need to create the blood overlay
    blood_texture_flag = false;
    
    // Creating the blood overlay without visibility on the screen.
    // It will become visible when a hit on the player occurs
    const blood_material = new THREE.SpriteMaterial({
        map: blood_texture,
        transparent: true,
        opacity: 0
    });
    blood_overlay = new THREE.Sprite(blood_material);

    // Calculating the correct scaling to adapt the sprit to fullscreen
    const distance = 1;
    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * camera.aspect;
    blood_overlay.scale.set(width, height, 1);

    // The overlay is in front of the camera
    camera.add(blood_overlay);
    blood_overlay.position.set(0, 0, -1);
}

function show_blood_damage()
{
    // Make the blood overlay visible
    blood_overlay.material.opacity = 1;
    blood_overlay.userData.startTime = clock.getElapsedTime();
    blood_overlay.userData.animationDuration = 2;

    // Set the flag visible
    blood_visible_flag = true;
}

function fadeOut_blood_damage()
{
    // The blood is not visible. No need to do something
    if ( !blood_visible_flag ) return;

    // Linear interpolation to fadeout the blood
    const elapsed = clock.getElapsedTime() - blood_overlay.userData.startTime;
    const t = elapsed / blood_overlay.userData.animationDuration;

    if (t < 1) 
        blood_overlay.material.opacity = 1 - t;
    else // When the animation is out, make the blood overlay disappear
    {
        blood_overlay.material.opacity = 0;
        blood_visible_flag = false;
    }
}

function generate_near_position(start_position, distance)
{
    // Random parameteers
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() + distance;

    // Random offset
    const dx = Math.cos(angle) * radius;
    const dz = Math.sin(angle) * radius;
    const dy = Math.random();

    return new THREE.Vector3(start_position.x + dx, start_position.y + dy, start_position.z + dz);
}

function spawn_monster(metin)
{
    // Check that the mob model is loaded with the texture
    if ( !mob_flag || !mob_texture_flag || !metin ) return;

    // We have to spawn the monster in corrispondence of the metin (near it)
    // only at the first hit
    if ( metin.userData.spawnedAssociatedMonsters ) return; // Monsters already spawned for this metin
    metin.userData.spawnedAssociatedMonsters = true;

    // Spawn the monsters hunter
    let m; let p; let s = CONFIG.monster_scale_default;
    for ( var i=0; i < CONFIG.number_hunter_per_metin; i++ )
    {
        // Adding the monster
        m = mob_model.clone();
        m.userData.typeMonster = CONFIG.monster_type_hunter;
        m.scale.set(s, s, s);
        spawned_mob.push(m);

        // Setting the position
        p = generate_near_position(metin.position, 6);
        m.position.set(p.x,p.y,p.z);

        // Parameters for animation
        m.userData.angleOffset = (Math.random() * 2 - 1) * 15 * Math.PI / 180;
        m.userData.associatedMetin = metin;
        m.userData.spawningAnimation = true;
        m.userData.startSpawning = clock.getElapsedTime();
        m.userData.base_y = 0;
        m.userData.baseDirection = new THREE.Vector3(0,0,-1);
        m.userData.followingPlayer = false;
        m.userData.speed = 6;
        m.userData.rotationSpeed = 2;
        m.userData.amplitude = 0.4;
        m.userData.lastSpell = 0;
        m.userData.life = CONFIG.monster_life;
        m.userData.maxLife = CONFIG.monster_life;

        // Adding the marker in the minimap
        create_marker_monster(m);

        // Attach the lifebar
        attach_health_bar(m);

        scene.add(m);
    }

    // Spawn the monsters guardian
    for ( var i=0; i < CONFIG.number_guardian_per_metin; i++ )
    {
        // Adding the monster
        m = mob_model.clone();
        m.userData.typeMonster = CONFIG.monster_type_guardian;
        m.scale.set(s, s, s);
        spawned_mob.push(m);

        // Setting the position
        p = generate_near_position(metin.position, 10);
        m.position.set(p.x,p.y,p.z);

        // Parameters for animation
        m.userData.angleOffset = (Math.random() * 2 - 1) * 13 * Math.PI / 180;
        m.userData.associatedMetin = metin;
        m.userData.spawningAnimation = true;
        m.userData.startSpawning = clock.getElapsedTime();
        m.userData.base_y = 0;
        m.userData.baseDirection = new THREE.Vector3(0,0,-1);
        m.userData.followingPlayer = false;
        m.userData.returningToMetin = false;
        m.userData.speed = 6;
        m.userData.rotationSpeed = 2;
        m.userData.amplitude = 0.4;
        m.userData.life = CONFIG.monster_life;
        m.userData.maxLife = CONFIG.monster_life;

        // Adding the marker in the map for the monster
        create_marker_monster(m);
        
        // Creation of the rocks which rotate around the monster
        m.userData.rotatingRocks = [];
        let r, x, y, z, theta_0, theta;
        const radius = CONFIG.guardian_radius_rotating_rocks;
        for ( var j = 0; j < CONFIG.guardian_rotating_rocks; j++ )
        {
            theta_0 = Math.random() * 2 * pi;
            
            r = spell_model.clone();
            theta = theta_0 + (2*pi / CONFIG.guardian_rotating_rocks)*j;
            r.scale.set(0.3, 0.3, 0.3);
            
            // Calculating initial coordinates
            x = m.position.x + radius * Math.cos(theta);
            y = m.position.y + 0.4;
            z = m.position.z + radius * Math.sin(theta);

            r.position.set(x,y,z);
            r.userData.theta = theta;

            scene.add(r);
            m.userData.rotatingRocks.push(r);
        }

        // Attach the lifebar
        attach_health_bar(m);

        scene.add(m);
    }
}

function animate_spawning_monster(delta)
{
    for ( const m of spawned_mob )
    {
        // If the monster is spawning, we update the animation
        if ( !m.userData.spawningAnimation ) continue;

        // Linear interpolation and scaling
        const elapsed = clock.getElapsedTime() - m.userData.startSpawning;
        const t = Math.min(elapsed / CONFIG.monster_scale_default, 1);
        const scaling = THREE.MathUtils.lerp(0, CONFIG.monster_scale_default, t);
        m.scale.set(scaling, scaling, scaling);

        // End of animation
        if (t == 1) 
            m.userData.spawningAnimation = false;
    }
}

function add_noise_direction(monster, dir) 
{
    const offset = monster.userData.angleOffset;
    const cos = Math.cos(offset);
    const sin = Math.sin(offset);

    // Apply the rotation (see rotation matrix 2D)
    const x = dir.x;
    const z = dir.z;

    dir.x = x * cos - z * sin;
    dir.z = x * sin + z * cos;
    
    return dir.normalize();
}

function animate_monster(delta)
{
    // If there are monster in the scene
    if ( spawned_mob.length < 0 ) return;
    
    // Useful for implementing animation
    const elapsed = clock.getElapsedTime();

    // Computing the vector which represents the visual direction of the player
    const camera_direction = new THREE.Vector3();
    camera.getWorldDirection(camera_direction).normalize();
    camera_direction.y = 0;
    
    // For each monster in the scene we animate it
    for ( const i of spawned_mob )
    {
        // If the monster is not spawning and is not marked to be destroyed
        if ( i.userData.spawningAnimation || i.userData.toBeDestroyed ) continue;
        
        // Basic animation for the monster (up and down)
        i.position.y = i.userData.base_y + Math.sin(elapsed * i.userData.rotationSpeed) * i.userData.amplitude + i.userData.amplitude;

        // Useful vectors
        var vector_player_monster = new THREE.Vector3().subVectors(camera.position, i.position);
        var vector_monster_metin = new THREE.Vector3().subVectors(i.userData.associatedMetin.position, i.position);

        // Updating the orientation of the monster. The orientation must depends on the target
        var target, new_watching_direction;
        if ( i.userData.returningToMetin ) // The target is the metin
        {
            target = i.userData.associatedMetin.position;
            new_watching_direction = vector_monster_metin.clone().normalize();  
        }
        else
        {
            target = camera.position;
            new_watching_direction = vector_player_monster.clone().normalize();
        }

        // Computing the orientation if we have defined a watching direction
        if ( new_watching_direction )
        {
            const dot = new_watching_direction.dot(i.userData.baseDirection);
            const rawAngle = Math.acos(dot); // Now we extract the angle, without knowing if the rotation is clockwise or not
            const cross = i.userData.baseDirection.x * new_watching_direction.z 
                                - i.userData.baseDirection.z * new_watching_direction.x;
            const angle = cross < 0 ? rawAngle : -rawAngle;
            
            // We use interpolation to get a smoother animation
            i.rotation.y = THREE.MathUtils.lerp(i.rotation.y, angle, 0.5);
        }

        // Applying the correct monster dynamics
        if ( i.userData.typeMonster == CONFIG.monster_type_hunter )
            hunter_dynamics(i, vector_player_monster, delta, target); // Hunter dynamics
        else if ( i.userData.typeMonster == CONFIG.monster_type_guardian ) // Guardian dynamics
            guardian_dynamics(i, vector_player_monster, vector_monster_metin, delta, target);
    }
}

function animate_guardian_rocks(delta)
{
    // If there are monster in the scene
    if ( spawned_mob.length < 0 ) return;
    
    // For each monster in the scene we animate it
    for ( const m of spawned_mob )
    {
        // If the monster is not spawning and is not marked to be destroyed
        if ( m.userData.toBeDestroyed ) continue;

        // Only the guardian monsters must be animated by this function
        if ( m.userData.typeMonster !== CONFIG.monster_type_guardian ) continue;
        if ( !m.userData.rotatingRocks ) continue;

        const rocks = m.userData.rotatingRocks;
        const radius = CONFIG.guardian_radius_rotating_rocks;
        const angularSpeed = 2.5; // rad/s

        for ( let i = 0; i < rocks.length; i++ )
        {
            const r = rocks[i];

            // Updating angle
            r.userData.theta += angularSpeed * delta;
            r.userData.theta %= (2 * Math.PI);

            // Applying Uniform Circular equations
            const theta = r.userData.theta;
            const x = m.position.x + radius * Math.cos(theta);
            const y = m.position.y + 0.4;
            const z = m.position.z + radius * Math.sin(theta);

            // Adding a random rotation to simulate a more realistic trip of the rock
            r.rotation.x += 0.05 + Math.random() * 0.01;
            r.rotation.y += 0.03 + Math.random() * 0.01;
            r.rotation.z += 0.04 + Math.random() * 0.01;

            // Updating the position
            r.position.set(x, y, z);
        }
    }
}

function hunter_dynamics(monster, vector_player_monster, delta, target)
{
    if ( monster.userData.temporaryMovement ) return;
    
    // The moster hunter must follow the player with a treshold of distance to mantain
    // The hunter starts to follow the player if the distance is above a certain treshold
    if ( vector_player_monster.length() > CONFIG.treshold_distance_follow_monster )
        monster.userData.followingPlayer = true;

    // Checking that the monster will not move in a direction that cause a collision
    // with a solid object. We start moving in a new direction to unlock the movement
    if ( check_collision_direction(monster, vector_player_monster, camera, 10) && monster.userData.followingPlayer )
    {
        monster.userData.monsterStucked = true;
        monster.userData.temporaryMovement = false;
        monster.userData.followingPlayer = false;
        
        // Start a temporary movement in a new direction
        start_temporary_movement(monster, vector_player_monster, camera);
    }

    // If the hunter sees the player or it's following him, he casts a spell against the player
    if ( vector_player_monster.length() < CONFIG.hunter_distance_attack )
    {
        // Checking the timeout
        var current_time = clock.getElapsedTime();
        if ( current_time - monster.userData.lastSpell > CONFIG.hunter_intervalTime_attack )
            cast_spell(monster, current_time);   
    }

    // Moving in the direction of the player if needed
    var movement_direction = vector_player_monster.normalize();
    if ( monster.userData.followingPlayer )
    {
        // Computing the effective movement
        var effective_movement = add_noise_direction(monster, movement_direction).multiplyScalar(monster.userData.speed * delta)
        var new_position = monster.position.clone().add(effective_movement);

        // Computing the future distance
        var new_distance = (new THREE.Vector3().subVectors(target, new_position)).length();

        // Applying the movement only if the hunter is not near the player
        if ( new_distance > CONFIG.hunter_distance_playerMonster )
            monster.position.add(effective_movement);
        else 
            monster.userData.followingPlayer = false;
    }
}

function guardian_dynamics(monster, vector_player_monster, vector_monster_metin, delta, target)
{
    if ( monster.userData.temporaryMovement ) return;

    // The moster guardian must follow the player with a treshold of distance to mantain
    // until he is not too far from the metin. When it happens, he returns near the metin
    if ( vector_monster_metin.length() > CONFIG.guardian_maxDistanceMetin )
    {
        monster.userData.followingPlayer = false;
        monster.userData.returningToMetin = true;
    }
    else if ( vector_player_monster.length() > CONFIG.guardian_distance_playerMonster &&
            vector_monster_metin.length() < CONFIG.guardian_maxDistanceMetin &&
            vector_player_monster.length() < CONFIG.guardian_maxVisualPlayer && !monster.userData.returningToMetin )
    {
        monster.userData.followingPlayer = true;
        monster.userData.returningToMetin = false;
    }

    // Checking that the monster will not move in a direction that cause a collision
    // with a solid object. We start moving in a new direction to unlock the movement
    if ( check_collision_direction(monster, vector_player_monster, camera, 10) && monster.userData.followingPlayer && !monster.userData.returningToMetin )
    {
        monster.userData.monsterStucked = true;
        monster.userData.temporaryMovement = false;
        monster.userData.followingPlayer = false;

        // Start a temporary movement in a new direction
        start_temporary_movement(monster, vector_player_monster, camera);
    }
    
    // Moving in the direction of the player if needed
    if ( monster.userData.followingPlayer )
    {
        // Computing the effective movement
        var movement_direction = vector_player_monster.normalize();
        var effective_movement = add_noise_direction(monster, movement_direction).multiplyScalar(monster.userData.speed * delta);
        var new_position = monster.position.clone().add(effective_movement);

        // Computing the future distances
        var new_distance_player_monster = (new THREE.Vector3().subVectors(target, new_position)).length();
        
        // Applying the movement only if the guardian is not near the player
        if ( new_distance_player_monster > CONFIG.guardian_distance_playerMonster )
            monster.position.add(effective_movement);
        else
            monster.userData.followingPlayer = false;
    }

    // Returning to metin if needed
    if ( monster.userData.returningToMetin )
    {
        // Computing the effective movement
        var movement_direction = vector_monster_metin.normalize();
        var effective_movement = add_noise_direction(monster, movement_direction).multiplyScalar(monster.userData.speed * delta)
        var new_position = monster.position.clone().add(effective_movement);

        // Computing the future distance
        var new_distance = (new THREE.Vector3().subVectors(target, new_position)).length();

        // Applying the movement only if the guardian is not near the metin
        if ( new_distance > CONFIG.guardian_defaultDistanceMetin )
            monster.position.add(effective_movement);
        else 
            monster.userData.returningToMetin = false;
    }
}

function commit_hit_hunter(spell)
{
    // Get player stats
    var stats = DM.getCurrentStats();
    
    // Get the current life of the player
    var life = parseInt(stats[2]);

    // Base damage
    var base_damage = CONFIG.baseEnemyDamage + CONFIG.current_level * CONFIG.enemyDamagePerLevel;

    // Received damage
    var received_damage = base_damage / (1 + stats[3] * 0.08);

    // Check if the player is defending and the spell come in front of him
    // In this case the received_damage is divided by 2
    if ( check_hit_defense(spell) )
        received_damage = received_damage / 2;
        
    // New value of life
    var new_life = life - received_damage;

    // Round the value of life
    new_life = Math.round(new_life * 10) / 10;

    // Updating the value
    DM.updateLife(new_life, CONFIG.init_life);
}

function hit_guardians(delta)
{
    for ( const m of spawned_mob )
    {
        // We have to consider only guardian monsters
        if (m.userData.typeMonster != CONFIG.monster_type_guardian) continue;

        const dist = m.position.distanceTo(camera.position);

        // The guardian hits when the player is near the rocks: [radius - 1, radius + 1]
        if (dist > CONFIG.guardian_radius_rotating_rocks + 1.5 ||
            dist < CONFIG.guardian_radius_rotating_rocks - 1.5 ) continue;

        // Init timer
        if (m.userData.damageTimer === undefined)
            m.userData.damageTimer = 1;
        m.userData.damageTimer -= delta;

        if (m.userData.damageTimer <= 0) 
        {
            m.userData.damageTimer = 1.5;

            // Commit the hit to the player
            var stats = DM.getCurrentStats();
            var life = parseInt(stats[2]);

            // New value of life
            var new_life = life - 0.5;

            // Round the value of life
            new_life = Math.round(new_life * 10) / 10;

            // Updating the value
            DM.updateLife(new_life, CONFIG.init_life);
        }
    }
}

function perform_hit_monster(monster)
{
    // Decrease life
    if ( sword.special_ability )
        monster.userData.life -= 2;
    else
        monster.userData.life -= 1;

    // Animate the hit
    shake_monster(monster);
    
    // If the life is 0, then we remove the metin from the scene
    if (monster.userData.life <= 0)
        trigger_monster_explosion(monster);
}

function catch_target_monster()
{
    // Max distance and degrees
    const max_distance = 2;
    const max_angle_deg = 60;

    // Camera direction (player's visual)
    const camera_direction = new THREE.Vector3();
    const cm = camera.position.clone(); cm.y = 0;
    camera.getWorldDirection(camera_direction);

    // Performing the catch for all possible mobs
    for (const mob of spawned_mob)
    {
        // Computing the direction and the distance, and checking that 
        // the distance is not too high
        const to_mob = new THREE.Vector3().subVectors(mob.position, cm);
        to_mob.y = cm.y;
        const distance = to_mob.length();
        if (distance > max_distance) continue;
        to_mob.normalize();

        // The hit succeeds only if the angle is not to high
        const angle_rad = camera_direction.angleTo(to_mob);
        const angle_deg = THREE.MathUtils.radToDeg(angle_rad);

        if (angle_deg <= max_angle_deg)
            perform_hit_monster(mob);
    }
}

function shake_monster(monster) 
{
    // Setting animation parameter    
    monster.userData.shake_duration = 0.2; 
    monster.userData.shake_elapsed = 0;    
    monster.userData.shake_origin = monster.position.clone();
}

function animate_shaking_monster(delta)
{
    // Check if there are monster currently being hitted
    for (const mob of spawned_mob) 
    {
        // If this flag does not exists, the monster can be skipped
        if ( !mob.userData.shake_duration ) continue;

        if (mob.userData.shake_duration > 0) 
        {
            // Time calculations
            mob.userData.shake_elapsed += delta;
            const remaining = mob.userData.shake_duration - mob.userData.shake_elapsed;

            // The monster can return to the original position
            if (remaining <= 0) 
            {
                mob.position.copy(mob.userData.shake_origin);
                delete mob.userData.shake_duration;
                delete mob.userData.shake_elapsed;
                delete mob.userData.shake_origin;
                continue;
            }

            // Shaking animation 
            const intensity = 0.05;
            const frequency = 10;
            const t = mob.userData.shake_elapsed;
            const decay = remaining / mob.userData.shake_duration;

            // Additive terms
            const offset_x = Math.sin(t * frequency * 2 * Math.PI) * intensity * decay;
            const offset_z = Math.cos(t * frequency * 2 * Math.PI) * intensity * decay;

            mob.position.set(
                mob.userData.shake_origin.x + offset_x,
                mob.userData.shake_origin.y,
                mob.userData.shake_origin.z + offset_z
            );
        }
    }
}

function trigger_monster_explosion(monster) 
{
    // Parameters for animation
    monster.userData.original_position = monster.position.clone();
    monster.userData.original_scale = monster.scale.clone();

    monster.userData.toBeDestroyed = true;
    monster.userData.durationPreExplosion = 1.2; // Pre-explosion duration
    monster.userData.timePreExplosion = 0;
}

function animate_pre_explosion_monster(delta) 
{
    // Analyzing all the monster that are in the pre-explosion phase
    for ( const monster of spawned_mob )
    {
        // Skip the monster that aren't in the pre-explosion phase
        if ( !monster.userData.toBeDestroyed ) continue;

        // Updating the animation time
        monster.userData.timePreExplosion += delta;

        if ( monster.userData.timePreExplosion < monster.userData.durationPreExplosion )
        {
            // Animating pulsation of the monster to show instability
            const pulse = 1 + Math.sin(monster.userData.timePreExplosion * 25) * 0.2 * (monster.userData.timePreExplosion / monster.userData.durationPreExplosion);
            monster.scale.set(
                monster.userData.original_scale.x * pulse,
                monster.userData.original_scale.y * pulse,
                monster.userData.original_scale.z * pulse
            );

            // Shaking the monster
            const shake_intensity = 0.03;
            monster.position.set(
                monster.userData.original_position.x + (Math.random() - 0.5) * shake_intensity,
                monster.userData.original_position.y + (Math.random() - 0.5) * shake_intensity,
                monster.userData.original_position.z + (Math.random() - 0.5) * shake_intensity
            );
        }
        else
        {
            // Triggering the explosion in fragments and removing the monster from the scene
            monster.scale.copy(monster.userData.original_scale);
            monster.position.copy(monster.userData.original_position);
            create_fragment_explosion(monster.userData.original_position);

            // If the monster is a guardian we have to remove the rock associated
            // Remove also the rotating rock if necessary
            if ( monster.userData.rotatingRocks )
            {
                for ( const r of monster.userData.rotatingRocks )
                    scene.remove(r);
            }

            remove_marker_object(monster);
            spawned_mob = spawned_mob.filter(o => o !== monster); // Remove from the array
            scene.remove(monster);
        }
    }
}

function create_fragment_explosion(origin_position, count = 100) 
{
    // Generating fragments
    for (let i = 0; i < count; i++)
    {
        // Random shapes to simulate fragments
        const shape_type = Math.floor(Math.random() * 3);
        
        // Geometry of the fragment
        let geometry;
        switch (shape_type) 
        {
            case 0:
                geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
                break;
            case 1:
                geometry = new THREE.ConeGeometry(0.05, 0.1, 6);
                break;
            case 2:
                geometry = new THREE.TetrahedronGeometry(0.07);
                break;
        }

        // Material of the fragment
        const material = new THREE.MeshStandardMaterial({
            map: mob_texture,
            metalness: 0.5,
            roughness: 0.5,
        });

        // Creation of the fragment
        const fragment = new THREE.Mesh(geometry, material);

        // Adding an offset to the monster position, to simulate the explosion
        const spread_offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        fragment.position.copy(origin_position.clone().add(spread_offset));

        // Random direction of the fragments
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.2),
            (Math.random() - 0.5) * 0.7
        ).normalize();

        // Each fragment has an associated random velocity and rotation
        const speed = 5 + Math.random() * 2;
        fragment.userData.velocity = direction.multiplyScalar(speed);
        fragment.userData.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );

        // Setting animation parameters
        fragment.userData.time = 0;
        fragment.userData.duration = 2.5;

        // Adding the fragments to the scene
        scene.add(fragment);
        fragments.push(fragment);
    }
}

function update_movement_fragment(delta) 
{
    // Analyzing fragment already present in the scene
    for (const f of fragments) 
    {
        // Updating time variable
        f.userData.time += delta;
        
        // Checking time animation
        if ( f.userData.time < f.userData.duration )
        {
            f.position.add(f.userData.velocity.clone().multiplyScalar(delta));
            f.userData.velocity.y -= 3.0 * delta;

            f.rotation.x += f.userData.rotationSpeed.x * delta;
            f.rotation.y += f.userData.rotationSpeed.y * delta;
            f.rotation.z += f.userData.rotationSpeed.z * delta;
        }
        else // The life of the current fragment is terminated
        {
            scene.remove(f);
            fragments = fragments.filter(o => o !== f); // Remove from the array
        }
    }
}


/* ---------------------------------------- SPELL MANAGEMENT ------------------------------------------ */
function create_spell(monster)
{
    // Without model it's impossible to create the spell object
    if ( !spell_model_flag ) return;
    
    // Adding the spell model to the scene
    var spell = spell_model.clone();
    spell.userData.spellCasted = true;
    spell.userData.initialScale = 0.2;
    spell.scale.set(spell.userData.initialScale, spell.userData.initialScale, spell.userData.initialScale);
    spell.position.set(monster.position.x, monster.position.y, monster.position.z);
    spell.userData.origin = spell.position.clone();
    scene.add(spell);

    // Enable shadows on all mesh components
    spell.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Attaching capture point to the spell
    init_trail_spell(spell, 15);

    return spell;
}

function dispose_spell(spell)
{
    // Remove from the array
    spell_casted = spell_casted.filter(s => s !== spell); 
    
    // Remove the spell from the scene and the associated trails
    scene.remove(spell);
    dispose_trail_spell(spell);
}

function cast_spell(monster, time)
{
    // Restart the time for the next spell
    monster.userData.lastSpell = time;
    
    // Create a new spell
    var spell = create_spell(monster);
    if ( !spell ) return;

    // The spell start from the current position of the monster, and it's directed to the player
    // We set the parameters of the movement
    spell.userData.speed = 10;
    spell.userData.startTime = clock.getElapsedTime();
    spell.userData.disposingActive = false;

    // Adding the spell to the array to be animated
    spell_casted.push(spell);
}

function animate_spell(delta) 
{
    for (const spell of spell_casted)
    {
        // Checking the collision with the shield
        check_spell_shield_collision(spell);

        // Without the hit the spell follows the player
        if ( !spell.userData.hitShield )
        {
            const direction_to_player = new THREE.Vector3().subVectors(camera.position, spell.position).normalize();
            spell.userData.velocity = direction_to_player.multiplyScalar(spell.userData.speed);
        }

        // Moving the spell
        spell.position.add(spell.userData.velocity.clone().multiplyScalar(delta));

        // Random rotation during the path, to simulate a more realistic effect
        spell.rotation.x += 0.05 + Math.random() * 0.01;
        spell.rotation.y += 0.03 + Math.random() * 0.01;
        spell.rotation.z += 0.04 + Math.random() * 0.01;

        // Drawing the trail associated to the spell
        update_bounding_box_spell(spell);
        update_trail_spell(spell);

        // Scale the spell based on the camera distance to have a nice effect
        const distance = spell.position.distanceTo(camera.position);
        const scale_factor = Math.min(spell.userData.initialScale, distance / 5);
        spell.scale.set(scale_factor, scale_factor, scale_factor);

        // When a collision occurs. Checking distance wrt to near clip plane of the frustrum
        if (distance < camera.near + 0.01)
        {
            commit_hit_hunter(spell);
            show_blood_damage();
            dispose_spell(spell);
        }
        else if (clock.getElapsedTime() - spell.userData.startTime > 10) // We remove the spell after 10s
        {
            if (!spell.userData.disposingActive)
            {
                spell.userData.disposingActive = true;
                spell.userData.disposingMaxTime = 2;
                spell.userData.disposingTime = 0.0;
            }

            animate_disposing_spell_timeout(spell, delta);
        }
    }
}

function animate_disposing_spell_timeout(spell, delta)
{
    // We apply a linear interpolation to dispose the spell, scaling it
    spell.userData.disposingTime += delta;
    const t = spell.userData.disposingTime / spell.userData.disposingMaxTime;

    // Scaling (from initialScale to 0)
    const scale = THREE.MathUtils.lerp(spell.userData.initialScale, 0, t);
    spell.scale.set(scale, scale, scale);

    // When the disposing effect is terminated we remove the spell
    if (t >= 1)
        dispose_spell(spell);
}

// Trail
function update_bounding_box_spell(spell) 
{
    // Creating a bounding box of the spell
    const box = new THREE.Box3().setFromObject(spell);

    // Boundaries of the box
    const min = box.min;
    const max = box.max;
    const center_z = (min.z + max.z) / 2;

    // Initializing the 4 points to capture the motion of the spell
    if (!spell.userData.pointFaces) 
        spell.userData.pointFaces = [
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
        ];
    
    // Setting the points based on the bounding box
    spell.userData.pointFaces[0].set((min.x + max.x) / 2, max.y, center_z);   // front-top
    spell.userData.pointFaces[1].set((min.x + max.x) / 2, min.y, center_z);   // back-bottom
    spell.userData.pointFaces[2].set(min.x, (min.y + max.y) / 2, center_z);   // left-middle
    spell.userData.pointFaces[3].set(max.x, (min.y + max.y) / 2, center_z);   // right-middle
}

function init_trail_spell(spell, maxTrailPoints = 10) 
{
    // Init of the trail info
    spell.userData.trail = {
        maxPoints: maxTrailPoints,
        pointsArrays: [[], [], [], []], // 4 lines at all
        trailLines: [],
    };

    // Material of lines
    const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.6,
        linewidth: 0.5,
    });

    // Creating the lines
    for (let i = 0; i < 4; i++) 
    {
        const lineGeometry = new THREE.BufferGeometry();
        const line = new THREE.Line(lineGeometry, trailMaterial);
        scene.add(line);
        spell.userData.trail.trailLines.push(line);
    }
}

function update_trail_spell(spell) 
{
    // Get trail info and points
    const trail = spell.userData.trail;
    const points = spell.userData.pointFaces;
    if ( !trail || !points ) return;

    // Updating all the lines, over all 4 faces
    for ( var i = 0; i < 4; i++ ) 
    {
        // Current position over the face i
        const pos = points[i];

        // Adding the last position
        trail.pointsArrays[i].push(pos.clone());

        // Deleting the useless points
        if (trail.pointsArrays[i].length > trail.maxPoints) 
            trail.pointsArrays[i].shift();
        
        // Creating the new array of position to build the new geometry
        const positions = new Float32Array(trail.pointsArrays[i].length * 3);
        trail.pointsArrays[i].forEach((v, idx) => {
            positions[idx * 3] = v.x;
            positions[idx * 3 + 1] = v.y;
            positions[idx * 3 + 2] = v.z;
        });

        // Updating the line
        const line = trail.trailLines[i];
        line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        line.geometry.setDrawRange(0, trail.pointsArrays[i].length);
        line.geometry.attributes.position.needsUpdate = true;
    }
}

function dispose_trail_spell(spell) 
{
    // If the trail info doesn't exists we don't have to do anything
    if ( !spell.userData.trail ) return;

    // Get the info
    const trail = spell.userData.trail;

    // Removing all the 4 lines
    trail.trailLines.forEach(line => {
        scene.remove(line);
        if (line.geometry)
            line.geometry.dispose();
        if (line.material)
            line.material.dispose();
    });

    // Deleting info
    delete spell.userData.trail;
    delete spell.userData.pointFaces;
}


/* ---------------------------------------- HEALTH BAR MANAGEMENT ---------------------------------------------- */
function attach_health_bar(monster) 
{
    // Creating the health bar as two planes (green and red)
    const bar_group = new THREE.Group();
    const back_bar = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.1),
        new THREE.MeshBasicMaterial({ color: 'darkred', depthTest: false })
    );
    const front_bar = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.1),
        new THREE.MeshBasicMaterial({ color: 'limegreen', depthTest: false })
    );
    front_bar.name = "health_fill";
    front_bar.position.z = 0.01;

    // Building the health bar
    bar_group.add(back_bar);
    bar_group.add(front_bar);
    bar_group.name = "health_bar";

    // Rotating the health bar as the monster's visual direction
    bar_group.rotation.y = pi;
    
    // Positioning the bar
    bar_group.position.set(0,2,0);
    monster.add(bar_group);
}

function update_monster_health_bar() 
{
    // Updating the health bar of the monsters
    for( const monster of spawned_mob )
    {
        // Getting the bar object and orienting it as the player camera
        const bar = monster.getObjectByName("health_bar");
        bar.lookAt(camera.position);

        // Calculating the percentage
        const health_percent = Math.max(monster.userData.life / monster.userData.maxLife, 0);
        
        // Scaling the green plane to simulate the current life value of the monster
        const green_bar = monster.getObjectByName("health_fill");
        if (green_bar) 
        {
            green_bar.scale.x = health_percent;
            green_bar.position.x = -(1 - health_percent) / 2;
        }
    }
}


/* ---------------------------------------- FINAL LEVEL MANAGEMENT -------------------------------------------- */
function init_final_level()
{
    // Change the game status
    status_game = "final_level";
    
    // Remove the tent from the solid objects. Now the map is empty
    solid_objects = [];
    
    // Spawn the final metin boss
    circle_modality = 1;
    load_boss_metin();
    
    // Removing the directional arrow
    camera.remove(directional_arrow);
    directional_arrow = undefined;

    // Create the rain and showing the associated slider
    create_rain();
    window.show_rain_slider();
}

function load_boss_metin()
{
    // Loading the final metin model. We also apply the texture to it
    UTILITY.loadGLBModel('metin_final.glb',(model) => {
        final_metin_model = model;
        final_metin_model_flag = true;
        final_metin_model.userData.emissive_materials = [];

        crack_texture.wrapS = THREE.RepeatWrapping;
        crack_texture.wrapT = THREE.RepeatWrapping;
        crack_texture.repeat.set(10,10);

        final_metin_model.userData.emissiveColor = 0x00ff00;
        final_metin_model.traverse(child => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    map: metin_texture,
                    emissiveMap: crack_texture,
                    emissive: new THREE.Color(final_metin_model.userData.emissiveColor),
                    emissiveIntensity: 1
                });

                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;

                final_metin_model.userData.emissive_materials.push(material);
            }
        })

        // Setting hyperparameters of the metin
        final_metin_model.userData.life = CONFIG.metin_life_additive_term + CONFIG.current_level * CONFIG.metin_life_coefficient;
        final_metin_model.userData.maxLife = CONFIG.metin_life_additive_term + CONFIG.current_level * CONFIG.metin_life_coefficient;
        final_metin_model.userData.spawnedAssociatedMonsters = false;
        final_metin_model.userData.originalScale = new THREE.Vector3(0.01,0.01,0.01);
        final_metin_model.userData.falling = true;
        final_metin_model.userData.falling_velocity = -100;
        metins.push(final_metin_model);

        // Positioning the final metin model
        final_metin_model.scale.set(0.015,0.015,0.015);
        final_metin_model.position.set(1, 50, -10);
        scene.add(final_metin_model);
    });
}

function spawn_final_metin(delta)
{
    // The final metin must be loaded in memory and must be falling
    if ( !final_metin_model_flag || !final_metin_model.userData.falling ) return;

    // Updating the metin position when falling
    control_keyboard = false;
    final_metin_model.position.y += final_metin_model.userData.falling_velocity * delta;

    // When the metin has reached the ground
    if (final_metin_model.position.y <= 0) 
    {
        // Parameters for impact animation
        final_metin_model.position.y = 0;
        final_metin_model.userData.falling = false;
        final_metin_model.userData.impactAnimation = true;
        final_metin_model.userData.timeImpact = 0;
        final_metin_model.userData.durationImpact = 1;

        // Setting parameters for spawning monster
        final_metin_model.userData.timeoutMonsters = CONFIG.final_metin_interval_monsters;
        final_metin_model.userData.timeSpawnMonsters = 0;

        solid_objects.push(final_metin_model);
        control_keyboard = true;
    }
}

function animate_impact(delta)
{
    // The metin must have reached the ground to simulate the impact
    if ( !final_metin_model_flag || !final_metin_model.userData.impactAnimation ) return;
    
    // Animation parameters
    const amplitude = 0.5;
    
    // Calculating the current animation time
    final_metin_model.userData.timeImpact += delta;
    const t = final_metin_model.userData.timeImpact / final_metin_model.userData.durationImpact;

    if ( t < 1 )
        final_metin_model.position.y = Math.sin(final_metin_model.userData.timeImpact * 15) * amplitude * (1 - t);
    else
    {
        final_metin_model.position.y = 0;
        final_metin_model.userData.impactAnimation = false;
    }
}

function spawn_monster_final_metin(delta)
{
    // The final metin must be spawned
    if ( !final_metin_model_flag || !final_metin_model.userData.timeoutMonsters ) return;

    // Updating the time
    final_metin_model.userData.timeSpawnMonsters += delta;
    final_metin_model.userData.timeSpawnMonsters = Math.min(final_metin_model.userData.timeoutMonsters, 
            final_metin_model.userData.timeSpawnMonsters);

    // If it is time to spawn the monsters
    if ( final_metin_model.userData.timeSpawnMonsters == final_metin_model.userData.timeoutMonsters )
    {
        // Reset of the timeout
        final_metin_model.userData.timeSpawnMonsters = 0;
        
        // Spawn monsters
        let m; let p; let s = CONFIG.monster_scale_default;
        for ( var i=0; i < CONFIG.final_metin_n_monsters; i++ )
        {
            // Adding the monster
            m = mob_model.clone();
            m.userData.typeMonster = CONFIG.monster_type_hunter;
            m.scale.set(s, s, s);
            spawned_mob.push(m);

            // Setting the position
            p = generate_near_position(final_metin_model.position, 9);
            m.position.set(p.x,p.y,p.z);

            // Parameters for animation
            m.userData.angleOffset = (Math.random() * 2 - 1) * 15 * Math.PI / 180;
            m.userData.associatedMetin = final_metin_model;
            m.userData.spawningAnimation = true;
            m.userData.startSpawning = clock.getElapsedTime();
            m.userData.base_y = 0;
            m.userData.baseDirection = new THREE.Vector3(0,0,-1);
            m.userData.followingPlayer = false;
            m.userData.speed = 6;
            m.userData.rotationSpeed = 2;
            m.userData.amplitude = 0.4;
            m.userData.lastSpell = 0;
            m.userData.life = CONFIG.monster_life;
            m.userData.maxLife = CONFIG.monster_life;

            // Adding the minimap marker
            create_marker_monster(m);

            // Attach the lifebar
            attach_health_bar(m);
            
            scene.add(m);
        }
    }
}

function create_rain()
{
    // Creating the geometry and the position array
    rain_positions = new Float32Array(active_rain_count * 6);
    rain_geometry = new THREE.BufferGeometry();
    
    for( let i=0; i < active_rain_count; i++ )
    {
        // The position of the drops is random
        const x = (Math.random() - 0.5) * 50;
        const y = Math.random() * 50;
        const z = (Math.random() - 0.5) * 50;

        // Setting the position
        rain_positions[i * 6] = x;              // x-value of the startpoint
        rain_positions[i * 6 + 1] = y;          // y-value of the startpoint
        rain_positions[i * 6 + 2] = z;          // z-value of the startpoint
        rain_positions[i * 6 + 3] = x;          // x-value of the endpoint
        rain_positions[i * 6 + 4] = y - 1.5;    // y-value of the endpoint  (1.5 is the length of the line)
        rain_positions[i * 6 + 5] = z;          // z-value of the endpoint
    }

    // Each three value we have a point of the geometry
    rain_geometry.setAttribute('position', new THREE.BufferAttribute(rain_positions, 3));

    // Creating the material of the rain
    const rain_material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa, 
        transparent: true, 
        opacity: 0.6
    });
    
    rain = new THREE.LineSegments(rain_geometry, rain_material);
    scene.add(rain);
}

function animate_rain(delta)
{
    // Getting the positions of drop
    const positions = rain_geometry.attributes.position.array;

    for (let i = 0; i < active_rain_count; i++)
    {
        // Animate each rain drop. We update both y-values
        // of startpoint and endpoint
        positions[i * 6 + 1] -= 0.3;
        positions[i * 6 + 4] -= 0.3;

        // When the drop reaches the ground
        if (positions[i * 6 + 1] < 0)
        {
            // Regenerating the drop
            const x = (Math.random() - 0.5) * CONFIG.map_dimension;
            const z = (Math.random() - 0.5) * CONFIG.map_dimension;
            const y = Math.random() * 50;
            
            // Setting the position of the startpoints
            positions[i * 6]     = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            // Setting the position of the endpoints
            positions[i * 6 + 3] = x;
            positions[i * 6 + 4] = y - 1.5;
            positions[i * 6 + 5] = z;
        }
    }

    rain_geometry.attributes.position.needsUpdate = true;
}

function change_rain_parameters(new_value)
{
    rain_speed = 0.05 + (new_value / 100) * 0.95;
    active_rain_count = Math.floor(rain_count * (0.1 + (new_value / 100) * 0.9)); // At least 10%
    
    // Disposing the rain and creating the new one
    dispose_rain();
    create_rain();
}
window.change_rain_parameters = change_rain_parameters;

function dispose_rain()
{
    // Removing the current rain
    if (rain) 
    {
        scene.remove(rain);
        rain.geometry.dispose();
        rain.material.dispose();
        rain_positions = undefined;
        rain_geometry = undefined;
        rain = null;
    }
}

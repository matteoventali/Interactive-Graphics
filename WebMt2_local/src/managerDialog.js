import { init_stamina } from "./config";

// Dialog and Stats manager
var interval_setted = false;
var empty_inventory = true;

/* --------------- MESSAGE MANAGEMENT --------------- */
export function showNewMessage(m)
{
    if ( m === "" ) return;

    // Pointer to the div element
    var div = document.getElementById("messageDialog");
    
    // Adding a new paragraph with the message embedded
    // after removing all children of the div
    clearMessageDialog()
    var p = document.createElement("p");
    p.innerHTML = m.toUpperCase();
    div.appendChild(p);

    // Make the div visible
    div.style.visibility = "visible";
}

export function showNewMessageStats(m)
{
    if ( m === "" ) return;

    // Pointer to the p element
    var p = document.getElementById("msgStats");

    if ( !interval_setted )
    {
        setInterval(clearMessageStats, 10000);
        interval_setted = true;
    }

    // Clean the p element and set the message
    clearMessageStats();
    
    p.innerHTML = m.toUpperCase();
}

export function clearMessageStats()
{
    // Pointer to the p element
    var p = document.getElementById("msgStats");

    while ( p.firstChild )
        p.removeChild(p.firstChild);
}

export function clearMessageDialog()
{
    // Pointer to the div element
    var div = document.getElementById("messageDialog");
    div.style.visibility = "hidden";

    // Removing all children of the div
    while ( div.firstChild )
        div.removeChild(div.firstChild);
}


/* ---------------STATS MANAGEMENT --------------- */
export function initStats(init_atk, init_life, init_coin, init_int, init_key)
{
    // References
    var atk = document.getElementById("atk_value");
    var stm = document.getElementById("stm_value");
    var coin = document.getElementById("coin_value");
    var life = document.getElementById("life_value");
    var int = document.getElementById("int_value");
    var key = document.getElementById("key_value");

    atk.innerHTML = init_atk;
    stm.innerHTML = init_stamina;
    coin.innerHTML = init_coin;
    life.innerHTML = init_life;
    int.innerHTML = init_int;
    key.innerHTML = init_key;
}

export function updateAttack(value)
{
    // Get the current atk value
    var atk = document.getElementById("atk_value");
    
    // Update the attack
    var atk_v = value;

    // Set the new atk value
    atk.innerHTML = atk_v;
}

export function updateCoin(value)
{
    // Get the current atk value
    var coin = document.getElementById("coin_value");
    
    // Update the coin value
    var coin_v = value;

    // Set the new coin value
    coin.innerHTML = coin_v;
}

export function updateStamina(value, max)
{
    // Get the current stamina value
    var stm = document.getElementById("stm_value");
    
    // Update the stamina
    var stm_v = value;

    // Set the new stamina value
    stm.innerHTML = stm_v;

    // Update the stamina bar
    update_stm_bar(stm_v, max);
}

export function updateShield(value, max)
{
    // Get the current stamina value
    var shd = document.getElementById("shield_value");
    
    // Update the stamina
    var shd_v = value;

    // Set the new stamina value
    shd.innerHTML = shd_v;

    // Update the stamina bar
    update_shd_bar(shd_v, max);
}

export function updateAbility(value, max)
{
    // Get the current key value
    var ability = document.getElementById("ability_value");
    
    // Update the key
    var ability_v = value;

    // Set the new key value
    ability.innerHTML = ability_v;
    update_ability_bar(value, max);
}

export function updateLife(value, max)
{
    // Get the current life value
    var life = document.getElementById("life_value");
    
    // Update the life
    var life_v = value;

    // Set the new life value
    life.innerHTML = life_v;

    // Update the life bar
    update_life_bar(life_v, max);
}

export function updateInt(value)
{
    // Get the current int value
    var int = document.getElementById("int_value");
    
    // Update the int
    var int_v = value;

    // Set the new int value
    int.innerHTML = int_v;
}

export function updateKey(value)
{
    // Get the current key value
    var key = document.getElementById("key_value");
    
    // Update the key
    var key_v = value;

    // Set the new key value
    key.innerHTML = key_v;
}

export function updateMetinHealth(current, max) 
{
    const div = document.getElementById("metinLife");
    const green = document.getElementById('metin-health-green');
    const red = document.getElementById('metin-health-red');
    
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    div.style.visibility = 'visible';
    green.style.width = percentage + '%';
    red.style.width = (100 - percentage) + '%';
}

function update_life_bar(current, max) 
{
    const green = document.getElementById("player-health-green");
    const red = document.getElementById("player-health-red");

    const pct = Math.max(0, Math.min(1, current / max));
    green.style.width = (pct * 100) + "%";
    red.style.width = ((1 - pct) * 100) + "%";
}

function update_stm_bar(current, max) 
{
    const green = document.getElementById("player-stm-green");
    const red = document.getElementById("player-stm-red");

    const pct = Math.max(0, Math.min(1, current / max));
    green.style.width = (pct * 100) + "%";
    red.style.width = ((1 - pct) * 100) + "%";
}

function update_shd_bar(current, max) 
{
    const purple = document.getElementById("player-shield-purple");
    const black = document.getElementById("player-shield-black");

    const pct = Math.max(0, Math.min(1, current / max));
    purple.style.width = (pct * 100) + "%";
    black.style.width = ((1 - pct) * 100) + "%";
}

function update_ability_bar(current, max) 
{
    const gold = document.getElementById("player-ability-gold");
    const black = document.getElementById("player-ability-black");

    const pct = Math.max(0, Math.min(1, current / max));
    gold.style.width = (pct * 100) + "%";
    black.style.width = ((1 - pct) * 100) + "%";
}

export function hideMetinHealth()
{
    const div = document.getElementById("metinLife");
    div.style.visibility = 'hidden';
}

export function getCurrentStats()
{
    var atk     =  parseFloat(document.getElementById("atk_value").innerHTML);
    var coin    =  parseInt(document.getElementById("coin_value").innerHTML);
    var life    =  parseFloat(document.getElementById("life_value").innerHTML);
    var int     =  parseInt(document.getElementById("int_value").innerHTML);
    var key     =  parseInt(document.getElementById("key_value").innerHTML);
    var stm     =  parseFloat(document.getElementById("stm_value").innerHTML);

    return [atk, coin, life, int, key, stm];
}

export function addNewEntryInventory(name)
{
    // Pointer to div inventory
    var div = document.getElementById("inventory");

    // Getting the first available number
    var n = parseInt(div.getAttribute("current_number")) + 1;
    div.setAttribute("current_number", n);

    // Adding new entry into the inventory
    var p = document.createElement("p");
    p.innerHTML = "[" + n + "] " + name.toUpperCase();
    div.appendChild(p); 

    // If it's the first time we have to show the inventory
    if ( empty_inventory )
    {
        div.style.visibility = "visible";
        empty_inventory = false;
        highlightCurrentSword(n);
    }

    return n;
}

export function showHideAbilityInventory(modality)
{
    // Pointer to div inventory
    var div = document.getElementById("inventory").children[1];

    // Remove the entry selected
    if ( modality == 0 )
        div.style.display = "none";
    else
        div.style.display = "block";
}

export function showSpecialAbilityStats(modality)
{
    // Pointer to div stats
    var div_stats = document.getElementById("ability_stats");

    // Remove the entry selected
    if ( modality == 0 )
        div_stats.style.display = "none";
    else
        div_stats.style.display = "flex";
}

export function highlightCurrentSword(num)
{
    // Pointer to div inventory
    var div = document.getElementById("inventory");
    num = num + 1;
    
    // If the inventory it's not empty
    if ( empty_inventory ) return;
        
    // Highlight the p associated to the current sword
    for ( var i=0; i < div.children.length; i++ )
    {
        if ( i != num )
            div.children[i].style.border = 'none';
        else
        {
            div.children[i].style.border = 'solid';
            div.children[i].style.border_color = 'white';
            div.children[i].style.padding = '3px';
        }
    }
}

export function highlightSpecialAbility(num, modality)
{
    // Pointer to div inventory
    var div = document.getElementById("inventory");

    // If the inventory it's not empty
    if ( empty_inventory ) return;
    
    // Highlight the p associated to the current sword
    if ( modality == 0 ) // Special ability deactivated
        div.children[num + 1].style.borderColor = 'white';
    else
        div.children[num + 1].style.borderColor = '#dabc12';
}


class StatusEffect {
    constructor(name, lossRate, maxHours, activeHours = 0, lastDate = 0, totalLoss = 0) {
        this.name = name;
        this.lossRate = lossRate;
        this.maxHours = maxHours;
        this.activeHours = activeHours;
        if(lastDate === 0) lastDate = Date.now();
        else{
            this.lastDate = lastDate;
        }
        
        this.totalLoss = totalLoss;
    }

    static calculateTotalLoss(effect, score) {
        return effect.lossRate * effect.maxHours * score;
    }
}

class CowPlayer {
    constructor(name, score, statusEffects = []) {  
        this.name = name;
        this.score = score;
        this.statusEffects = statusEffects;
    }

    static fromLocalStorage(key) {
        let data = localStorage.getItem(key);
        if (data === null) return null;
        let parsedData = JSON.parse(data);

        // Construct StatusEffect instances from the parsed data
        let statusEffects = parsedData.statusEffects.map(effectData => 
            new StatusEffect(effectData.name, effectData.lossRate, effectData.maxHours, effectData.activeHours, effectData.lastDate, effectData.totalLoss)
        );
        
        return new CowPlayer(parsedData.name, parsedData.score, statusEffects);
    }

    hasEffect(effectName) {
        return this.statusEffects.some(effect => effect.name === effectName);
    }

    addEffect(effect) {
        if (!this.hasEffect(effect.name)) {
            this.statusEffects.push(effect);
        }
    }

    removeEffect(effectName) {
        this.statusEffects = this.statusEffects.filter(effect => effect.name !== effectName);
    }
    applyEffect(effect) {
        console.log("Total Loss: " + effect.totalLoss)
        let currentDate = Date.now();
        let diffInMs = currentDate - effect.lastDate;
        let diffInHours = diffInMs / 1000 / 60 / 60;
        let activeHours = 0;
        let savedActiveHours = effect.activeHours;

        activeHours = effect.activeHours + diffInHours;

        if (activeHours > effect.maxHours) {
            diffInHours = effect.maxHours - savedActiveHours;
            this.removeEffect(effect.name);
        }

        this.score -= diffInHours/effect.maxHours * effect.totalLoss;
        if(this.score <= 1) {
            this.score = 0;
            this.removeEffect(effect.name);
        }
        else{
            effect.activeHours = activeHours;
        }
        
        savePlayer(this);
    }

    applyAllEffects() {
        this.statusEffects.forEach(effect => this.applyEffect(effect));
    }
}

function getStatusEffectByName(name) {
    return PRESET_STATUS_EFFECTS.find(effect => effect.name === name);
}

const PRESET_STATUS_EFFECTS = [
    new StatusEffect('Drunk', 60, 0.002), 
    new StatusEffect('Fire', 10, 0.002) 
];

let players = [];

function saveInputToLocalStorage(key, id) {
    localStorage.setItem(key, document.getElementById(id).value);
}

function retrieveFromLocalStorage(key) {
    return localStorage.getItem(key);
}

function inputUpdate(id, val) {
    document.getElementById(id).textContent = "Hello, " + val;
}

function updateTextWithInput(id, val) {
    document.getElementById(id).textContent = "Hello, " + val;
}

function loadPlayers() {
    players = [];
    let playerTablesDiv = document.getElementById('playerTables');
    playerTablesDiv.innerHTML = '';
    let playerCount = localStorage.length;
    for (let i = 0; i < playerCount; i++) {
        let key = localStorage.key(i);
        if(key == 'LastDate') continue;
        let player = CowPlayer.fromLocalStorage(key)
        players.push(player);
        displayPlayer(player, key);
    }
}

function savePlayer(player) {
    localStorage.setItem(player.name, JSON.stringify(player));
}

function savePlayers(players) {
    players.forEach((player, index) => {
        savePlayer(player, index);
    });
}

function addPlayer(name) {
    players.push(new CowPlayer(name, 0));
    savePlayers(players);
    loadPlayers();
}

function deletePlayer(key) {
    localStorage.removeItem(key);
    loadPlayers();
}

function updateScore(key, newScore) {
    let player = CowPlayer.fromLocalStorage(key);
    player.score = newScore;
    savePlayer(player);
    loadPlayers();
}

function addScore(key, score) {
    let player = CowPlayer.fromLocalStorage(key);
    score = parseFloat(score);
    playerScore = parseFloat(player.score);

    playerScore += score;
    player.score = playerScore;
    savePlayer(player);
    loadPlayers();
}




function updateAllTimeFields() {
    players.forEach(player => {
        player.applyAllEffects();
    });
    savePlayers(players);
    loadPlayers();
}


function addButton(parent, name, callback) {
    let tableRow = document.createElement('tr');
    let button = document.createElement('button');
    button.classList.add('button');
    button.textContent = name;
    button.addEventListener('click', callback);
    tableRow.appendChild(button);
    parent.appendChild(tableRow);

}

//Might need to change the system so the entire set of players isn't loaded everytime something changes
//Add a modify player function not just displayPlayer, creating a whole new page.

function displayPlayer(player, key) {
    
    let baseTable = document.createElement('table');
    baseTable.classList.add('base-table');

    let playerTable = document.createElement('table');

    let nameRow = document.createElement('tr');
    let nameValue = document.createElement('td');
    nameValue.appendChild(document.createTextNode(player.name));
    nameRow.appendChild(nameValue);

    let scoreRow = document.createElement('tr');
    let scoreValue = document.createElement('td');
    scoreValue.appendChild(document.createTextNode(Math.round(player.score)));
    scoreRow.appendChild(scoreValue);

    let addInput = document.createElement('input');
    addInput.classList.add('text-input');
    addInput.id = key + '_score';
    addInput.type = "number";
    addInput.onchange = function () {
        addScore(key, addInput.value);
    }

    let addRow = document.createElement('tr');
    addRow.appendChild(addInput);

    playerTable.appendChild(nameRow);
    playerTable.appendChild(scoreRow);
    playerTable.appendChild(addRow);

    let buttonTable = document.createElement('table');
    buttonTable.classList.add('button-table');

    addButton(buttonTable, 'Church', () => {
        updateScore(key, player.score * 2); 
        player.drunk = false; 
        player.fire = false;})
    addButton(buttonTable, 'Graveyard', () => updateScore(key, player.score / 2))
    // It seems like the first time you press this there is a large drop. Time might be off.
    PRESET_STATUS_EFFECTS.forEach(effect => {
        addButton(buttonTable, effect.name, () => {
            if (player.hasEffect(effect.name)) {
                player.removeEffect(effect.name);
            } else if(player.score > 0) {
  
                // It's important not to directly push Effect as that would lead all players sharing same status instance.
                let clonedStatus = new StatusEffect(
                        effect.name,
                        effect.lossRate,
                        effect.maxHours,
                        effect.activeHours,
                        Date.now(),
                        StatusEffect.calculateTotalLoss(effect, player.score));
                player.addEffect(clonedStatus);
            }
            updateAllTimeFields();
        });
        let effectRow = document.createElement('tr');
        let effectValue = document.createElement('td');
        if (player.hasEffect(effect.name)) {
            effectValue.appendChild(document.createTextNode(effect.name + ": " + 'Yes'));
        }
        else{
            effectValue.appendChild(document.createTextNode(effect.name + ": " + 'No'));
        }
        effectRow.appendChild(effectValue);
        
       playerTable.appendChild(effectRow); 
    });

    
    addButton(buttonTable, 'Delete', () => {
        var result = confirm("Are you sure you want to delete? " + player.name);
        if (result) deletePlayer(key);
    })



    let playerTablesDiv = document.getElementById('playerTables');
    playerTd = document.createElement('td');
    playerTd.appendChild(playerTable);
    buttonTd = document.createElement('td');
    buttonTd.appendChild(buttonTable);
    baseTable.appendChild(playerTd);
    baseTable.appendChild(buttonTd);

    playerTablesDiv.appendChild(baseTable);

}
// const intervalId = setInterval(updateAllTimeFields, 1000);
loadPlayers();
updateAllTimeFields();



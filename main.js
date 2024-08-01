const oneHourInMilliseconds = 60 * 60 * 1000;


class StatusEffect {
    //Time in milliseconds
    // I need to add an end time, and use that for deletion
    constructor(name, totalChange, maxHours, score, startTime = -1, endTime = -1) {
        this.name = name;
        this.totalChange = totalChange;
        this.maxHours = maxHours;
        this.score = score;
        if(startTime === -1) {
            startTime = Date.now();
            // console.log("Start Time is -1");
        }
        this.startTime = startTime;
        if(endTime === -1){
            endTime = startTime + maxHours * oneHourInMilliseconds;
            // console.log("End Time is -1");
        } 
        this.endTime = endTime;
        // console.log("Start Time: " + this.startTime);
        // console.log("End Time: " + this.endTime);
    }   
    getScoreReduction(currentTime) {
        console.log("Status Effect: " + this.name);
        // console.log("Current Time: " + (currentTime - 1722037368376) / oneHourInMilliseconds);
        // console.log("Start Time: " + (this.startTime - 1722037368376) / oneHourInMilliseconds);
        // console.log("End Time: " + (this.endTime - 1722037368376) / oneHourInMilliseconds);
        // console.log("Max Hours: " + this.maxHours);
        console.log("Score: " + this.score);
        // console.log("Total Change: " + this.totalChange);
        //This shouldn't happen
        if (currentTime < this.startTime) return 0;
        if(this.startTime > this.endTime) {
            console.log("Error: Start time is greater than end time");
            return 0;
        }
        let elapsedTime;
        //Delete the statusEffect
        if (currentTime > this.endTime) {
            elapsedTime = this.endTime - this.startTime;
        }
        else{
            elapsedTime = currentTime - this.startTime;
        }
        console.log("Elapsed Time: " + elapsedTime);
        // Calculate the elapsed hours considering the loss rate
        const elapsedHours = elapsedTime / oneHourInMilliseconds;
        const scoreReduction = this.totalChange * elapsedHours / this.maxHours;
        // Print name of status effect
        
        console.log("Score Reduction: " + scoreReduction);
        this.startTime = currentTime;
        return scoreReduction * this.score;
    }

    isActive(currentDate) {
        return currentDate < this.endTime && currentDate >= this.startTime
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
        //constructor(name, totalChange, maxHours, startTime = -1, endTime = -1) {
        let statusEffects = parsedData.statusEffects.map(effectData => 
            new StatusEffect(effectData.name, effectData.totalChange, effectData.maxHours, effectData.score, effectData.startTime, effectData.endTime)
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

    applyAllEffects(currentDate) {
            let totalScoreChangeRatio = 0;
            let totalScoreChange = 0;
            this.statusEffects.forEach(statusEffect => {
                //totalScoreChangeRatio += statusEffect.getScoreReduction(currentDate);
                totalScoreChange += statusEffect.getScoreReduction(currentDate);
                if(!statusEffect.isActive(currentDate)){
                    this.removeEffect(statusEffect.name);
                }
            });
            //this.score = this.score * (1 + totalScoreChangeRatio);
            console.log("Total Score Change: " + totalScoreChange);
            this.score = this.score + totalScoreChange;
            savePlayer(this);
            return totalScoreChangeRatio;
        }
    
    updateStatusEffectScores(){
            this.statusEffects.forEach(statusEffect => {
                statusEffect.score = this.score;
            });
        }
    }



function getStatusEffectByName(name) {
    return PRESET_STATUS_EFFECTS.find(effect => effect.name === name);
}

const PRESET_STATUS_EFFECTS = [
    new StatusEffect('Drunk', -0.1, 0.001, 0, 0, 0), 
    new StatusEffect('Fire', -0.5, 0.0083333, 0, 0 , 0), 
];

let players = [];

function saveInputToLocalStorage(key, id) {
    localStorage.setItem(key, document.getElementById(id).value);
}

function retrieveFromLocalStorage(key) {
    return localStorage.getItem(key);
}

function loadPlayers() {
    players = [];
    let playerTablesDiv = document.getElementById('playerTables');
    playerTablesDiv.innerHTML = '';
    let playerCount = localStorage.length;
    for (let i = 0; i < playerCount; i++) {
        let key = localStorage.key(i);
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
    //We might not need this call
    player.applyAllEffects(Date.now());
    player.score = newScore;
    player.updateStatusEffectScores();
    savePlayer(player);
    loadPlayers();
}

function addScore(key, score) {
    let player = CowPlayer.fromLocalStorage(key);
    score = parseFloat(score);
    playerScore = parseFloat(player.score);

    playerScore += score;
    player.score = playerScore;
    player.updateStatusEffectScores();
    savePlayer(player);
    loadPlayers();
}

function updateAllTimeFields() {
    players.forEach(player => {
        player.applyAllEffects(Date.now());
    });
    console.log(players[0].statusEffects);
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
        player.applyAllEffects(Date.now());
        // updateScore(key, player.score + addInput.value);
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
        player.applyAllEffects(Date.now());
        updateScore(key, player.score * 2); 
        player.drunk = false; 
        player.fire = false;})
    addButton(buttonTable, 'Graveyard', () => {
        player.applyAllEffects(Date.now());
        updateScore(key, player.score / 2);
    })
    PRESET_STATUS_EFFECTS.forEach(effect => {
        addButton(buttonTable, effect.name, () => {
            if (player.hasEffect(effect.name)) {
                player.removeEffect(effect.name);
            } else if(player.score > 0) {
  
                // It's important not to directly push Effect as that would lead all players sharing same status instance.
                let clonedStatus = new StatusEffect(
                        effect.name,
                        effect.totalChange,
                        effect.maxHours,
                        player.score,
                        Date.now(),
                        Date.now() + effect.maxHours * oneHourInMilliseconds
                );
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
    let playerTd = document.createElement('td');
    playerTd.appendChild(playerTable);
    buttonTd = document.createElement('td');
    buttonTd.appendChild(buttonTable);
    baseTable.appendChild(playerTd);
    baseTable.appendChild(buttonTd);

    let qrDiv = document.createElement('div');
    qrDiv.classList.add('qr-container');
    let qr = qrcode(0, 'L');
    qr.addData("https://schraederbr.github.io/?playerinfo=" + JSON.stringify(player));
    qr.make();
    qrDiv.innerHTML = qr.createImgTag(6);
    
    playerTd.appendChild(qrDiv);
    playerTablesDiv.appendChild(baseTable);
}

loadPlayers();
updateAllTimeFields();
// const intervalId = setInterval(updateAllTimeFields, 1000);


// This is stuff to add players from the URL
function getNewPlayerInfo() {
    const params = new URLSearchParams(window.location.search);
    const playerInfo = params.get('playerinfo');
    return playerInfo;
}


function addPlayerFromUrl() {
    const playerInfo = getNewPlayerInfo();
    if (playerInfo) {
        console.log(playerInfo);
        let parsedData = JSON.parse(playerInfo);

        let statusEffects = parsedData.statusEffects.map(effectData => 
            new StatusEffect(effectData.name, effectData.totalChange, effectData.maxHours, effectData.score, effectData.startTime, effectData.endTime)
        );
        
        players.push(new CowPlayer(parsedData.name, parsedData.score, statusEffects));
        savePlayers(players);
        loadPlayers();
    } 
    
}

// Wait for the DOM to load before running the script
document.addEventListener('DOMContentLoaded', addPlayerFromUrl);
//May want to add this back. 
//There is a problem with coming back to the game after closing, 
//the score isn't properly lowered. 
//



"use strict";
//Mikor lesz már TS? :D
//Constants
const GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID = "dom__game__table";
const GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID = "dom__game__message";

const GRAPHICAL_INTERFACE_PLACEABLE_STATE_NAME = "placeable";
const GRAPHICAL_INTERFACE_PLACED_STATE_NAME = "placed";

const GAME_SETTINGS_AVALIBLE_VALUES = ["X", "O"];

const DEFAULT_CHAIN_LENGTH = 3;
const DEFAULT_ROWS = 3;
const DEFAULT_COLUMNS = 3;

class Game {
    constructor(gameInterface, requiredChain = DEFAULT_CHAIN_LENGTH) {
        this.gameInterface = gameInterface;
        this.requiredChain = requiredChain;
        this.ended = false;
        this.nextStep = 0;
        this.fillEmptyGameDataSet();
        this.registerCallbacks();
        this.sendNextStepperStatus();
    }

    fillEmptyGameDataSet() {
        this.gameDataSet = [];
        for (let row = 0; row < this.gameInterface.sizeRow; row++) {
            const rowDataSet = [];
            for (let column = 0; column < this.gameInterface.sizeColumn; column++) {
                rowDataSet.push(null);
            }
            this.gameDataSet.push(rowDataSet);
        }
        this.gameInterface.updateInterfaceByGameData(this.gameDataSet);
    }

    onElementPlaced(row, column) {
        //Todo: row column validation
        if (this.gameDataSet[row][column] === null && this.ended === false) {
            this.gameDataSet[row][column] = GAME_SETTINGS_AVALIBLE_VALUES[this.nextStep];
            this.gameInterface.updateInterfaceByGameData(this.gameDataSet);
            this.nextStep++;
            if (this.nextStep === GAME_SETTINGS_AVALIBLE_VALUES.length) {
                this.nextStep = 0;
            }
            this.checkGameStatus();
            this.sendNextStepperStatus();
        } else if (this.ended === true) {
            throw Exception("Már véget ért!");
        } else {
            throw Exception("Ott már volt elem!");
        }
    }

    gameEnded() {
        this.gameInterface.gameEnded();
        this.gameInterface.sendMessage(`Vége a játéknak`)
        this.ended = true;
    }

    checkGameStatus() {
        const avalible_space = this.gameDataSet.flat().includes(null);
        if (avalible_space === false) {
            this.gameEnded();
        }

        const winner = this.checkWinner();
        if (GAME_SETTINGS_AVALIBLE_VALUES.includes(winner)) {
            this.gameEnded();
            this.gameInterface.sendMessage(`Nyertes: ${winner}`);
        }
    }

    checkWinner() {
        //Todo: Algorithmic performance optimization
        //Mindegyik pozícióból indulóan 4 irányba ellenőrizzük, hogy a requiredChain megvan-e.
        for (let row = 0; row < this.gameDataSet.length; row++) {
            for (let column = 0; column < this.gameDataSet[row].length; column++) {
                const expectedValue = this.gameDataSet[row][column];
                if (GAME_SETTINGS_AVALIBLE_VALUES.includes(expectedValue)) {
                    if (this.checkWinnerFromPosition(row, column, expectedValue) === true) {
                        return expectedValue;
                    }
                }
            }
        }
        return false;
    }

    _getSafeElementByPosition(row, column) {
        if (row < this.gameDataSet.length) {
            if (column < this.gameDataSet[row].length) {
                return this.gameDataSet[row][column];
            }
        }
        return undefined;
    }

    checkWinnerFromPosition(row, column, expectedValue) {
        let horizontalMatchCount = 0;
        let verticalMatchCount = 0;
        let diagonallyRightDownMatchCount = 0;
        let diagonallyLeftDownMatchCount = 0;
        //Elméletileg, mivel mindegyik elemen végig megyünk így nem kell a jobbra/balra felfele átlót ellenőrizni,
        //  mivel a jobbra és balra le ellenőrzésekor korábban már ellenőrzésre kerül.
        for (let chainCounter = 0; chainCounter < this.requiredChain; chainCounter++) {
            //Horizontálisan ellenőrizzük, hogy van-e egyezés
            if (this._getSafeElementByPosition(row, column + chainCounter) === expectedValue) horizontalMatchCount++;
            //Vertikálisan ellenőrizzük, hogy van-e egyezés
            if (this._getSafeElementByPosition(row + chainCounter, column) === expectedValue) verticalMatchCount++;
            //Jobbra le átlósan ellenőrizzük, hogy van-e nyertes
            if (this._getSafeElementByPosition(row + chainCounter, column + chainCounter) === expectedValue) diagonallyRightDownMatchCount++;
            //Balra le átlósan ellenőrizzük, hogy van-e nyertes
            if (this._getSafeElementByPosition(row + chainCounter, column - chainCounter) === expectedValue) diagonallyLeftDownMatchCount++;
        }


        //Todo: Vélhetően a chain hosszánál nem lesz nagyobb az egyező szám...
        //Todo: Feleslegesen túráztatjuk a gépet, ha már az egyik módszerrel megtaláltuk a nyertest
        if (horizontalMatchCount >= this.requiredChain || verticalMatchCount >= this.requiredChain || diagonallyRightDownMatchCount >= this.requiredChain || diagonallyLeftDownMatchCount >= this.requiredChain) {
            return true;
        }
        return false;

    }

    registerCallbacks() {
        this.gameInterface.registerGameCallback(this.onElementPlaced.bind(this));
    }

    sendNextStepperStatus() {
        if (this.ended === false) {
            this.gameInterface.sendMessage(`A következő lépés: ${GAME_SETTINGS_AVALIBLE_VALUES[this.nextStep]} `)
        }
    }
}

class GameInterface {
    constructor(containerId, sizeColumn = DEFAULT_COLUMNS, sizeRow = DEFAULT_ROWS) {
        //private
        this.containerId = containerId;
        //public
        this.sizeColumn = sizeColumn;
        //public
        this.sizeRow = sizeRow;
        this.initialize();
    }
}

class DOMGameInterface extends GameInterface {

    initialize() {
        const messageElement = document.createElement("p");
        messageElement.id = GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID;
        const tableElement = document.createElement("table");
        tableElement.id = GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID;
        for (let row = 0; row < this.sizeRow; row++) {
            const trElement = document.createElement("tr");
            for (let column = 0; column < this.sizeColumn; column++) {
                const tdElement = document.createElement("td");
                tdElement.dataset.column = column;
                tdElement.dataset.row = row;
                tdElement.dataset.gameState = GRAPHICAL_INTERFACE_PLACEABLE_STATE_NAME;
                trElement.appendChild(tdElement);
            }
            tableElement.appendChild(trElement);
        }
        const containerElement = document.getElementById(this.containerId);
        containerElement.innerHTML = "";

        containerElement.appendChild(tableElement);
        containerElement.appendChild(messageElement);

        //El kell menteni egy külön változóba, hogy a függvény pointer később a bindoltat tudja eltávolítani
        this.clickHandler = this.clickEventHandler.bind(this);
        this.updateClickEventListeners();
    }

    //public
    updateInterfaceByGameData(gameDataSet) {
        this.drawInterface(gameDataSet);
        this.updateClickEventListeners();
    }

    //public
    registerGameCallback(chooseElementCallback) {
        this.chooseElementCallback = chooseElementCallback;
    }

    gameEnded() {
        const elements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID} td`);
        elements.forEach(element => element.removeEventListener("click", this.clickHandler));

        const containerElement = document.getElementById(this.containerId);
        const newGameElement = document.createElement("button");
        newGameElement.innerHTML = "New Game";
        newGameElement.addEventListener("click", newGame);
        containerElement.appendChild(newGameElement);

    }

    //public
    sendMessage(message) {
        document.querySelector(`p#${GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID}`).innerHTML = message;
    }

    sendElementChoose(row, column) {
        this.chooseElementCallback(row, column);
    }

    //Intrace specifikus

    updateClickEventListeners() {
        //Todo: Performance optimization
        const clickableElements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID} td[data-game-state='${GRAPHICAL_INTERFACE_PLACEABLE_STATE_NAME}']`);
        const clickedElements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID} td[data-game-state='${GRAPHICAL_INTERFACE_PLACED_STATE_NAME}']`);
        clickableElements.forEach(element => element.addEventListener("click", this.clickHandler));
        clickedElements.forEach(element => element.removeEventListener("click", this.clickHandler));
    }

    clickEventHandler(event) {
        this.sendElementChoose(event.target.dataset.row, event.target.dataset.column);
    }

    drawInterface(gameDataSet) {
        //Todo: Performance optimization
        //Végig sétálunk a sorokon és az oszlopokon.
        for (let row = 0; row < gameDataSet.length; row++) {
            for (let column = 0; column < gameDataSet[row].length; column++) {
                const graphicalElement = document.querySelector(`#${GRAPHICAL_INTERFACE_TABLE_ELEMENT_ID} td[data-row='${row}'][data-column='${column}']`);
                const gameValue = gameDataSet[row][column];

                if (GAME_SETTINGS_AVALIBLE_VALUES.includes(gameValue)) {
                    //Hogyha a gameState állapota nem placed, placed-re állítjuk
                    if (graphicalElement.dataset.gameState !== GRAPHICAL_INTERFACE_PLACED_STATE_NAME) {
                        graphicalElement.dataset.gameState = GRAPHICAL_INTERFACE_PLACED_STATE_NAME;
                    }
                    // Todo: Default class handling
                    //Hogyha 1-nél több osztály van hozzárendelve a cellához, eltávolítjuk az összeset
                    if (graphicalElement.classList.length > 1) {
                        graphicalElement.classList = [];
                    }
                    //Hogyha a mező tartalma mint osztály, nincs a cellához rendelve, hozzárendeljük
                    if (!graphicalElement.classList.contains(gameValue)) {
                        graphicalElement.classList.add(gameValue);
                    }
                } else {
                    //Hogyha a gameState állapota nem placeable, placeable-re állítjuk
                    if (graphicalElement.dataset.gameState !== GRAPHICAL_INTERFACE_PLACEABLE_STATE_NAME) {
                        graphicalElement.dataset.gameState = GRAPHICAL_INTERFACE_PLACEABLE_STATE_NAME;
                    }
                    // Todo: Default class handling
                    //Hogyha 0-nél több osztály van hozzárendelve a cellához, eltávolítjuk az összeset
                    if (graphicalElement.classList.length > 0) {
                        graphicalElement.classList = [];
                    }
                }
            }
        }
    }

}

let currentGame = undefined;
let currentInterface = undefined;

const newGame = () => {
    currentInterface = new DOMGameInterface("dom__game__interface");
    currentGame = new Game(currentInterface);
}

newGame();
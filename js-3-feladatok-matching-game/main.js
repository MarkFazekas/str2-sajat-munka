"use strict";
//Constants
const GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID = "dom__game__grid__container";
const GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_CLASS = "grid-container";
const GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID = "dom__game__message";
const GRAPHICAL_INTERFACE_TIMER_ELEMENT_ID = "dom__game__timer";

const GRAPHICAL_INTERFACE_FRONT_IMAGES = Array(5).fill().map((_, idx) => `https://picsum.photos/200/300?random=${idx}&blur`)
const GRAPHICAL_INTERFACE_BACK_IMAGES = Array(50).fill().map((_, idx) => `https://picsum.photos/200/300?random=${5 + idx}`)

const GRAPHICAL_INTERFACE_SHOWABLE_STATE_NAME = "showable";
const GRAPHICAL_INTERFACE_SHOWED_STATE_NAME = "showed";

const DEFAULT_COLUMNS = 5;
const DEFAULT_ITEMS = 5;


class Game {
    constructor(gameInterface, numberOfItems = DEFAULT_ITEMS) {
        this.gameInterface = gameInterface;
        this.started = false;
        this.ended = false;
        this.clicks = 0;
        this.numberOfItems = numberOfItems;

        this.currentlyShowedElements = 0;

        this.fillEmptyGameDataSet();
        this.registerCallbacks();
        this.sendNextStepperStatus();
    }

    fillEmptyGameDataSet() {
        //Todo: Make it interface specific
        if (GRAPHICAL_INTERFACE_BACK_IMAGES.length < this.numberOfItems) {
            //Todo inkább mi vigyünk fel generálással
            throw new Exception("Vigyél fel még több képet a GRAPHICAL_INTERFACE_BACK_IMAGES-be");
        }

        this.currentBackImages = shuffle([...GRAPHICAL_INTERFACE_BACK_IMAGES]).slice(0, this.numberOfItems);
        this.currentSortedBackImages = shuffle([...this.currentBackImages, ...this.currentBackImages]);
        this.currentFrontImage = shuffle([...GRAPHICAL_INTERFACE_FRONT_IMAGES]).slice(0, 1);

        this.gameInterface.initialize(this.currentFrontImage, this.currentSortedBackImages)

        this.gameDataSet = [];
        for (let item = 0; item < this.currentSortedBackImages.length; item++) {
            this.gameDataSet.push({ "showing": false, "paired": false, "value": this.currentSortedBackImages[item] });
        }
        this.gameInterface.updateInterfaceByGameData(this.gameDataSet);
    }

    writeElapsedTime(endTime = new Date()) {
        const elapsedTime = endTime.getTime() - this.startedDate.getTime();
        // Dolgok amiket production kódba nem írunk ha nem akarunk egy oldalas code review-t látni.
        this.gameInterface.sendTimeMessage(`Eltelt idő: ${Math.trunc(elapsedTime / 60 / 1000).toString().padStart(2, 0)}:${Math.trunc(elapsedTime / 1000 % 60).toString().padStart(2, 0)}.${Math.trunc(elapsedTime % 1000).toString().padStart(4, 0)}`)
    }

    onElementClicked(selectedIndex, selectedValue) {
        if (this.started === false) {
            this.started = true;
            this.startedDate = new Date();
            this.timeSender = setInterval(() => this.writeElapsedTime(), 5);
        }

        if (this.gameDataSet[selectedIndex] !== undefined && this.ended === false && this.currentlyShowedElements < 2) {
            const elementData = this.gameDataSet[selectedIndex];
            if (elementData.showing === false) {
                this.currentlyShowedElements++;
                elementData.showing = true;
                this.clicks++;
            }

            this.gameInterface.updateInterfaceByGameData(this.gameDataSet);
            this.sendNextStepperStatus();

            if (this.currentlyShowedElements === 2) {
                const anotherShowingElement = currentGame.gameDataSet.filter((element, index) => element.showing && index !== selectedIndex)[0]
                // Interface specific
                if (anotherShowingElement.value === elementData.value) {
                    this.gameInterface.sendMessage(`Találat! Hurry up!`);
                    elementData.showing = false;
                    anotherShowingElement.showing = false;
                    elementData.paired = true;
                    anotherShowingElement.paired = true;
                    this.currentlyShowedElements = 0;
                    this.gameInterface.updateInterfaceByGameData(this.gameDataSet);

                    const notPairedElements = currentGame.gameDataSet.filter((element, index) => !element.paired);
                    if(notPairedElements.length < 2){
                        this.gameEnded();
                    }
                } else {
                    this.gameInterface.sendMessage(`Nincs Találat :-( 2 másodperc bünti idő`);
                    setTimeout(() => {
                        elementData.showing = false;
                        anotherShowingElement.showing = false;
                        this.currentlyShowedElements = 0;
                        this.gameInterface.updateInterfaceByGameData(this.gameDataSet);
                    }, 2000);

                }
            }
        } else if (this.ended === true) {
            throw new Exception("Már véget ért!");
        }
    }

    gameEnded() {
        this.endedDate = new Date();
        clearInterval(this.timeSender);
        this.writeElapsedTime(this.endedDate);
        this.ended = true;
        this.gameInterface.gameEnded();
        setTimeout(this.gameInterface.sendMessage(`Vége a játéknak, 5 másodperc múlva indul a következő. Kattintásaid száma: ${this.clicks}`), 100)        
    }

    registerCallbacks() {
        this.gameInterface.registerGameCallback(this.onElementClicked.bind(this));
    }

    sendNextStepperStatus() {
        if (this.started === false) {
            return this.gameInterface.sendMessage(`A játék elkezdéséhez kattints valamelyik képre`);
        }
        if (this.ended === false) {
            this.gameInterface.sendMessage(`Kattintásaid száma: ${this.clicks} `)
        }
    }
}

class GameInterface {
    constructor(containerId, sizeColumn = DEFAULT_COLUMNS) {
        //private
        this.containerId = containerId;
        //public
        this.sizeColumn = sizeColumn;
    }
}

class DOMGameInterface extends GameInterface {

    initialize(currentFrontImage, currentSortedBackImages) {
        const containerElement = document.getElementById(this.containerId);
        containerElement.innerHTML = "";

        const messageElement = document.createElement("p");
        messageElement.id = GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID;
        containerElement.appendChild(messageElement);

        const timerElement = document.createElement("p");
        timerElement.id = GRAPHICAL_INTERFACE_TIMER_ELEMENT_ID;
        containerElement.appendChild(timerElement);

        const gridContainerElement = document.createElement("div");
        gridContainerElement.id = GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID;
        gridContainerElement.classList.add(GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_CLASS);
        gridContainerElement.style = `grid-template-columns: ${"auto ".repeat(this.sizeColumn)};`;

        for (let item = 0; item < currentSortedBackImages.length; item++) {
            const currentValueOfGrid = currentSortedBackImages[item];

            const gridElement = document.createElement("div");
            gridElement.classList.add("grid-item");
            gridElement.dataset.index = item;
            gridElement.dataset.value = currentValueOfGrid;
            gridElement.dataset.gameState = GRAPHICAL_INTERFACE_SHOWABLE_STATE_NAME;

            const flipCardElement = document.createElement("div");
            flipCardElement.classList.add("flip-card");

            const flipCardInnerElement = document.createElement("div");
            flipCardInnerElement.classList.add("flip-card-inner");

            const flipCardFrontElement = document.createElement("div");
            flipCardFrontElement.classList.add("flip-card-front");

            const flipCardFrontImageElement = document.createElement("img");
            flipCardFrontImageElement.src = currentFrontImage;
            flipCardFrontElement.appendChild(flipCardFrontImageElement);

            flipCardInnerElement.appendChild(flipCardFrontElement);


            const flipCardBackElement = document.createElement("div");
            flipCardBackElement.classList.add("flip-card-back");

            const flipCardBackImageElement = document.createElement("img");
            flipCardBackImageElement.src = currentValueOfGrid;
            flipCardBackElement.appendChild(flipCardBackImageElement);

            flipCardInnerElement.appendChild(flipCardBackElement);

            flipCardElement.appendChild(flipCardInnerElement);

            gridElement.appendChild(flipCardElement);

            gridContainerElement.appendChild(gridElement);
        }

        containerElement.appendChild(gridContainerElement);

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
        const elements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div`);
        elements.forEach(element => element.removeEventListener("click", this.clickHandler));

        const containerElement = document.getElementById(this.containerId);
        const newGameElement = document.createElement("button");
        newGameElement.innerHTML = "New Game";
        newGameElement.addEventListener("click", newGame);
        containerElement.appendChild(newGameElement);

        setTimeout(newGame, 5000);
    }

    //public
    sendMessage(message) {
        document.querySelector(`p#${GRAPHICAL_INTERFACE_MESSAGE_ELEMENT_ID}`).innerHTML = message;
    }

    //public
    sendTimeMessage(time) {
        document.querySelector(`p#${GRAPHICAL_INTERFACE_TIMER_ELEMENT_ID}`).innerHTML = time;
    }

    sendElementChoose(selectedIndex, selectedValue) {
        this.chooseElementCallback(parseInt(selectedIndex), selectedValue);
    }

    //Intrace specifikus

    updateClickEventListeners() {
        //Todo: Performance optimization
        const clickableElements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div[data-game-state='${GRAPHICAL_INTERFACE_SHOWABLE_STATE_NAME}']`);
        const clickedElements = document.querySelectorAll(`#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div[data-game-state='${GRAPHICAL_INTERFACE_SHOWED_STATE_NAME}']`);
        clickableElements.forEach(element => element.addEventListener("click", this.clickHandler));
        clickedElements.forEach(element => element.removeEventListener("click", this.clickHandler));
    }

    clickEventHandler(event) {
        const specified = parents(event.target, `#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div[data-game-state='${GRAPHICAL_INTERFACE_SHOWABLE_STATE_NAME}']`)
        this.sendElementChoose(specified.dataset.index, specified.dataset.value);
    }

    drawInterface(gameDataSet) {
        for (let item = 0; item < gameDataSet.length; item++) {
            const graphicalElement = document.querySelector(`#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div[data-index='${item}']`);
            const innerFlipCardElement = document.querySelector(`#${GRAPHICAL_INTERFACE_GRID_CONTAINER_ELEMENT_ID} div[data-index='${item}'] .flip-card-inner`);;
            const gameValue = gameDataSet[item];
            if (gameValue.showing || gameValue.paired) {
                innerFlipCardElement.classList.add("flipped-card");
            } else {
                innerFlipCardElement.classList.remove("flipped-card");
            }
        }
    }

}

function shuffle(array) {
    //https://stackoverflow.com/a/2450976/4883952
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function parents(el, selector) {
    //https://stackoverflow.com/a/64035024/4883952
    var parent_container = el;
    do {
        parent_container = parent_container.parentNode;
    }
    while (!parent_container.matches(selector) && parent_container !== document.body);

    return parent_container;
}

let currentGame = undefined;
let currentInterface = undefined;

const newGame = () => {
    currentInterface = new DOMGameInterface("dom__game__interface");
    currentGame = new Game(currentInterface);
}

newGame();
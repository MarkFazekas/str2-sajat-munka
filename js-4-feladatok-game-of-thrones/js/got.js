'use strict';

//It's a very bad idea. Memory leak here we go...
let characterInformation = null;

const CHARACTER_CONTAINER_ID = "character__container";
const SEARCH_RESULT_CONTAINER_ID = "search__result__container";

const CHARACTER_ELEMENT_CLASS = "character__element";
const CHARACTER_IMAGE_CLASS = "character__portrait";
const CHARACTER_NAME_CLASS = "character__name";

const CLICKED_CHARACTER_ELEMENT_CLASS = "character__clicked";
const SEARCH_RESULT_CONTAINER_FOUND_ELEMENT_CLASS = "search__result__found";
const SEARCH_RESULT_HOUSE_FOUND_ELEMENT_CLASS = "search__result__house__found";

const SEARCH_RESULT_PICTURE_ELEMENT_ID = "result__picture";
const SEARCH_RESULT_NAME_ELEMENT_ID = "result__name";
const SEARCH_RESULT_HOUSE_ELEMENT_ID = "result__house";
const SEARCH_RESULT_BIO_ELEMENT_ID = "result__bio";

const filterCharacters = (characters = [{ name: '' }]) => {
    //It's a very bad idea to filter in frontend.
    return characters.filter(character => character.dead !== true)
};

const sortCharacters = (characters = [{ name: '' }]) => {
    //It's a very bad idea to sort in frontend.
    return characters.sort((a, b) => {
        let [aFirstName, aLastName] = a.name.split(" ");
        let [bFirstName, bLastName] = b.name.split(" ");

        if (aLastName === undefined) {
            aLastName = aFirstName;
        }
        if (bLastName === undefined) {
            bLastName = bFirstName;
        }

        //A B - C D
        if (aLastName !== bLastName) {
            return aLastName.localeCompare(bLastName);
        }
        //A B - C B
        if (aLastName === bLastName) {
            return aFirstName.localeCompare(bFirstName);
        }
        return a.name.localeCompare(b.name);
    })
};

const getCharacterInfo = (url) =>
    fetch(new Request(url))
        .then(response => response.json())
        .then(data => filterCharacters(data))
        .then(data => sortCharacters(data))
        .catch((err) => console.error(err))


const fillCharacterImages = (characters) => {
    const baseElement = document.querySelector(`#${CHARACTER_CONTAINER_ID}`);
    baseElement.innerHTML = "";
    characters.forEach((character, index) => {
        if (index <= 47) {
            const characterElement = document.createElement("div");
            characterElement.classList.add(CHARACTER_ELEMENT_CLASS);

            const characterImage = document.createElement("img");
            characterImage.classList.add(CHARACTER_IMAGE_CLASS);
            characterImage.src = character["portrait"];
            characterElement.appendChild(characterImage);

            const characterName = document.createElement("p");
            characterName.innerText = character["name"];
            characterName.classList.add(CHARACTER_NAME_CLASS);
            characterElement.appendChild(characterName);

            baseElement.appendChild(characterElement);
        }
    })
}

const clickHandler = (originalElement) => {
    const characterName = originalElement.querySelector(`.${CHARACTER_NAME_CLASS}`)
    showOneCharacterInformationByName(characterName.innerHTML);
}

const applyCharacterSelection = () => {
    const characterElements = document.querySelectorAll(`.${CHARACTER_ELEMENT_CLASS}`);
    //Memory Leak
    characterElements.forEach(element => element.addEventListener("click", () => clickHandler(element)));
}

const showOneCharacterInformationByName = (name) => {
    // Mutatom mit nem szabad csinálni
    const resultContainer = document.querySelector(`#${SEARCH_RESULT_CONTAINER_ID}`)
    resultContainer.classList.remove(SEARCH_RESULT_CONTAINER_FOUND_ELEMENT_CLASS);
    const characterElements = document.querySelectorAll(`.${CHARACTER_ELEMENT_CLASS}`);
    characterElements.forEach(element => element.classList.remove(CLICKED_CHARACTER_ELEMENT_CLASS));

    const comparable = name.replace(/\s+/g, '').toLowerCase();
    let foundCharacterData = characterInformation.find((characterData) => characterData["name"].replace(/\s+/g, '').toLowerCase() === comparable)
    if (foundCharacterData === undefined) {
        foundCharacterData = characterInformation.find((characterData) => {
            const comparableName = characterData["name"].replace(/\s+/g, '').toLowerCase();
            return comparableName.startsWith(comparable) || comparableName.endsWith(comparable) || comparableName.includes(comparable);
        });
    }

    if (foundCharacterData === undefined) {
        return alert("Character not found");
    }


    const pictureElement = resultContainer.querySelector(`#${SEARCH_RESULT_PICTURE_ELEMENT_ID}`);
    // With slow internet, there would be some seconds before the correct image shows up
    pictureElement.src = "";
    pictureElement.src = foundCharacterData["picture"] ?? `https://picsum.photos/350/200?random=${Number(new Date())}`;

    // const pictureRefreshData = pictureElement.innerHTML;
    // pictureElement.innerHTML = pictureRefreshData;

    const nameElement = resultContainer.querySelector(`#${SEARCH_RESULT_NAME_ELEMENT_ID}`);
    nameElement.innerHTML = foundCharacterData["name"];

    const houseElement = resultContainer.querySelector(`#${SEARCH_RESULT_HOUSE_ELEMENT_ID}`);
    houseElement.classList.remove(SEARCH_RESULT_HOUSE_FOUND_ELEMENT_CLASS);
    if (foundCharacterData["house"] !== undefined) {
        // With slow internet, there would be some seconds before the correct image shows up
        houseElement.src = "";
        houseElement.src = `assets/houses/${foundCharacterData["house"]}.png`;
        houseElement.classList.add(SEARCH_RESULT_HOUSE_FOUND_ELEMENT_CLASS);
    }

    const bioElement = resultContainer.querySelector(`#${SEARCH_RESULT_BIO_ELEMENT_ID}`);
    bioElement.innerHTML = foundCharacterData["bio"];

    //Show in Result panel
    resultContainer.classList.add(SEARCH_RESULT_CONTAINER_FOUND_ELEMENT_CLASS);

    //Apply Clicked Class
    const foundCharacterElement = Array(...characterElements).find((characterElement) => characterElement.querySelector(`.${CHARACTER_NAME_CLASS}`).innerHTML === foundCharacterData["name"])
    if (foundCharacterElement !== undefined) {
        foundCharacterElement.classList.add(CLICKED_CHARACTER_ELEMENT_CLASS);
    }
}

const fillImages = async () => {
    characterInformation = await getCharacterInfo("./json/got.json");
    fillCharacterImages(characterInformation);
    applyCharacterSelection();
}

const applySearch = (buttonSelector, inputSelector) => {
    const inputElement = document.querySelector(`${inputSelector}`)
    const buttonElement = document.querySelector(`${buttonSelector}`)
    const searchFunction = () => {
        showOneCharacterInformationByName(inputElement.value);
        inputElement.value = "";
    }
    buttonElement.addEventListener("click", searchFunction)
    inputElement.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            searchFunction();
        }
    });
}

export {
    fillImages, applySearch
}
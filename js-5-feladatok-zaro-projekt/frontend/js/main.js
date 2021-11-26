'use strict';

const BASE_URL_PATH = "http://localhost:3000/users/"

const USERS_TABLE_ID = "user__table";

const TOAST_WRONG_NAME = "toast__wrong__name";
const TOAST_WRONG_EMAIL = "toast__wrong__email";
const TOAST_WRONG_ADDRESS = "toast__wrong__address";
const TOAST_SUCCESS_SAVE = "toast__success__save";
const TOAST_WARNING_EDITING = "toast__warning__editing";

const DOM_DATA_ACTION_EDIT = "edit";
const DOM_DATA_ACTION_DELETE = "delete";
const DOM_DATA_ACTION_CREATE = "create";
const DOM_DATA_ACTION_UPDATE = "update";
const DOM_DATA_ACTION_CANCEL = "cancel";

const DOM_DATA_EDITING_STATUS = "editing";

const REGEXP_NAME_VALIDATOR = /^[^\s]+( [^\s]+)+$/;
//RFC2822
const REGEXP_EMAIL_VALIDATOR = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const REGEXP_ADDRESS_VALIDATOR = /^(\d+)\s+(.*)|(.*)\s+(\d+)$/

///HTTP Start

const fetchErrorHandler = (error) => {
    console.log('error', error);
    alert(`Something went wrong :(\nThe error: ${error.message}`);
}

const fetchNotOkHandler = (response) => {
    if (!response.ok) {
        let message = "Not 2xx response"
        switch (response.status) {
            case 404:
                message = "Desired resource is not found on the server!"
                break;
        }
        const err = new Error(message);
        err.response = response;
        throw err;
    }
    return response;
}

const getAllUsers = async () => {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    //A rendezés azért kell, hogy az új elemek a táblázat elején jelenjenek meg.
    //(Minden normális helyen az utolsó helyen jelennek meg 😛)
    return fetch(`${BASE_URL_PATH}?_sort=id&_order=desc`, requestOptions)
        .then(fetchNotOkHandler)
        .then(response => response.json())
        .catch(fetchErrorHandler)
}

const getUserById = async ({ id }) => {
    const requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    return fetch(`${BASE_URL_PATH}${id}`, requestOptions)
        .then(fetchNotOkHandler)
        .then(response => response.json())
        .catch(fetchErrorHandler)
}

const deleteUser = async ({ id }) => {
    const requestOptions = {
        method: 'DELETE',
        redirect: 'follow'
    };

    return fetch(`${BASE_URL_PATH}${id}`, requestOptions)
        .then(fetchNotOkHandler)
        // .then(response => response.json())
        .catch(fetchErrorHandler)
}

const postUser = async (userData) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(userData);

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    return fetch(BASE_URL_PATH, requestOptions)
        .then(fetchNotOkHandler)
        .catch(fetchErrorHandler)
}


const updateUser = async (userData) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(userData);

    const requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    return fetch(`${BASE_URL_PATH}${userData["id"]}`, requestOptions)
        .then(fetchNotOkHandler)
        .then(response => response.json())
        .catch(fetchErrorHandler)
}

///HTTP End
///

const createUserRow = ({ id, name, emailAddress, address }) => {
    return `<tr data-id="${id}">
    <th scope="row">${id}</th>
    <td>${name}</td>
    <td>${emailAddress}</td>
    <td>${address}</td>
    <td><button type="button" class="btn btn-primary" data-id="${id}" data-action="${DOM_DATA_ACTION_EDIT}">Edit</button></td>
    <td><button type="button" class="btn btn-danger" data-id="${id}" data-action="${DOM_DATA_ACTION_DELETE}">Delete immediately</button></td>
</tr>`;
}


const editingUserRow = ({ id, name, emailAddress, address }) => {
    return `<tr data-id="${id}" data-editing="${DOM_DATA_EDITING_STATUS}">
        <td><input type="number" class="form-control" id="id" name="id" value="${id}" placeholder="Id" readonly></td>
        <td><input type="text" class="form-control" id="name" name="name" value="${name}" placeholder="Full Name"></td>
        <td><input type="text" class="form-control" id="emailAddress" name="emailAddress" value="${emailAddress}" placeholder="Email Address"></td>
        <td><input type="text" class="form-control" id="address" name="address" value="${address}" placeholder="Mailing Address"></td>
        <td><button type="submit" class="btn btn-primary" data-id="${id}">Update</button></td>
        <td><button type="button" class="btn btn-secondary" data-id="${id}" data-action="${DOM_DATA_ACTION_CANCEL}">Cancel</button></td>
</tr>`;
}

///
const removeUserRowFromTable = ({ id }) => {
    //Erre csak azért van szükség, mert úgy értettem, hogy akkor is ki kell törölni a DOM-ból, hogyha a törlés egyébként sikertelen. (pl elmegy a szerver)
    document.querySelectorAll(`#${USERS_TABLE_ID} tr[data-id='${id}']`)[0].remove();
}


const modifyUserRouter = async (event) => {
    const editingNum = document.querySelectorAll(`#${USERS_TABLE_ID} tr[data-editing='${DOM_DATA_EDITING_STATUS}']`);
    if (editingNum.length > 0 && event.target.dataset.action !== DOM_DATA_ACTION_CANCEL) {
        bootstrap.Toast.getInstance(document.getElementById(TOAST_WARNING_EDITING)).show();
        return;
    }

    switch (event.target.dataset.action) {
        case DOM_DATA_ACTION_DELETE:
            // removeUserRowFromTable(event.target.dataset);
            await deleteUser(event.target.dataset);
            refreshTable();
            break;
        case DOM_DATA_ACTION_EDIT:
            startUserEdit(event.target.dataset);
            break;
        case DOM_DATA_ACTION_CANCEL:
            refreshTable();
            break;
    }
}

const userDataValidator = ({ name, emailAddress, address }) => {
    let valid = true;
    if (name.match(REGEXP_NAME_VALIDATOR) === null) {
        bootstrap.Toast.getInstance(document.getElementById(TOAST_WRONG_NAME)).show();
        valid = false;
    }
    if (emailAddress.match(REGEXP_EMAIL_VALIDATOR) === null) {
        bootstrap.Toast.getInstance(document.getElementById(TOAST_WRONG_EMAIL)).show();
        valid = false;
    }
    if (address.match(REGEXP_ADDRESS_VALIDATOR) === null) {
        bootstrap.Toast.getInstance(document.getElementById(TOAST_WRONG_ADDRESS)).show();
        valid = false;
    }
    return valid;
}

const createOrUpdateUser = async (event) => {
    event.preventDefault();
    const formElem = event.target;
    const formData = new FormData(formElem);

    const userData = {};
    for (let pair of formData.entries()) {
        userData[pair[0]] = pair[1];
    }

    if (userDataValidator(userData)) {        
        formElem.reset();
        if (userData.hasOwnProperty("id")) {
            await updateUser(userData);
        } else {
            await postUser(userData);
        }
        await refreshTable();
        bootstrap.Toast.getInstance(document.getElementById(TOAST_SUCCESS_SAVE)).show();
    }

}

const startUserEdit = async (userData) => {
    const editingNum = document.querySelectorAll(`#${USERS_TABLE_ID} tr[data-editing='${DOM_DATA_EDITING_STATUS}']`);
    if (editingNum.length > 0) {
        bootstrap.Toast.getInstance(document.getElementById(TOAST_WARNING_EDITING)).show();
    } else {
        const result = await getUserById(userData);
        const userDom = editingUserRow(result);
        document.querySelector(`#${USERS_TABLE_ID} tr[data-id='${result["id"]}']`).outerHTML = userDom;

        const addUserElements = document.querySelectorAll(`[data-action='${DOM_DATA_ACTION_UPDATE}']`);
        addUserElements.forEach(element => element.addEventListener("submit", createOrUpdateUser));

        addEventListeners();
    }
}

const refreshTable = async () => {
    const results = await getAllUsers();
    if (isNotNil(results)) {
        const baseElement = document.querySelector(`#${USERS_TABLE_ID}`);
        baseElement.innerHTML = "";
        results.forEach(result => {
            const userDom = createUserRow(result);
            // Possible Cross Site Scripting attack
            baseElement.insertAdjacentHTML('beforeend', userDom);
        });
        addEventListeners();

    }
}

const addEventListeners = () => {
    const actionButtonElements = document.querySelectorAll(`#${USERS_TABLE_ID} button[data-action]`);
    actionButtonElements.forEach(element => element.removeEventListener("click", modifyUserRouter));
    actionButtonElements.forEach(element => element.addEventListener("click", modifyUserRouter));
    // const deleteButtonElements = document.querySelectorAll(`#${USERS_TABLE_ID} [data-action='${DOM_DATA_ACTION_DELETE}']`);
    // deleteButtonElements.forEach(element => element.addEventListener("click", modifyUserRouter));
    // const editButtonElements = document.querySelectorAll(`#${USERS_TABLE_ID} [data-action='${DOM_DATA_ACTION_EDIT}']`);
    // editButtonElements.forEach(element => element.addEventListener("click", modifyUserRouter));
}

const listenUserAdder = () => {
    const addUserElements = document.querySelectorAll(`[data-action='${DOM_DATA_ACTION_CREATE}']`);
    addUserElements.forEach(element => element.addEventListener("submit", createOrUpdateUser));
}

const initBootstrap = () => {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'))
    const toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl)
    })
}

refreshTable();
listenUserAdder();
initBootstrap();
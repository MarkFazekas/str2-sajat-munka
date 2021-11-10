"use strict";

const modalContainer = document.querySelector('.modal__container');
const modalOpen = document.querySelector(".btn__modalOpen");
const modalClose = document.querySelectorAll(".btn__modalClose");

modalOpen.addEventListener('click', () => {
    setTimeout(() => {
        modalContainer.classList.add('modal__visible');
        modalContainer.classList.remove('modal__hidden');
        modalClose[0].focus();    
    }, 1)
});

modalClose.forEach(element => element.addEventListener('click', () => {
    modalContainer.classList.remove('modal__visible');
    modalContainer.classList.add('modal__hidden');
}))

modalContainer.addEventListener('click', e => {
    if (!document.querySelector(".modal__content").contains(e.target)) {
        modalContainer.classList.remove('modal__visible');
        setTimeout(() => modalContainer.classList.add('modal__hidden'), 300);
    }
});

// modalOpen.click();
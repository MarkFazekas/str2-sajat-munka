"use strict";

const modalContainer = document.querySelector('.modal__container');
const modalOpen = document.querySelector(".btn__modalOpen");
const modalClose = document.querySelectorAll(".btn__modalClose");

modalOpen.addEventListener('click', () => {
    setTimeout(() => {
        modalContainer.classList.remove('modal__hidden');
        // Ha egyidőben kerül le a display none és kerül rá az opacity 1, akkor eleve opacity 1-el 
        //  renderelődik ki, ezért minimum 1 ms-ig, opacity 0-s lesz az elem.
        setTimeout(() => modalContainer.classList.add('modal__visible'), 1);
        modalClose[0].focus();    
    }, 1)
});

modalClose.forEach(element => element.addEventListener('click', () => {
    closeModal();
}))

function closeModal(){
    modalContainer.classList.remove('modal__visible');
    setTimeout(() => modalContainer.classList.add('modal__hidden'), 300);
}

modalContainer.addEventListener('click', e => {
    if (!document.querySelector(".modal__content").contains(e.target)) {
        closeModal();
    }
});

// modalOpen.click();
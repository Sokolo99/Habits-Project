'use strict';

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
let globalActiveHabbitId;

/* page */

const page = {
    menu: document.querySelector('.menu__list'),
    header: {
        h1: document.querySelector('.h1'),
        progressPercent: document.querySelector('.progress__percent'),
        progressCoverBar: document.querySelector('.progress__cover-bar'),
    },
    content: {
        daysContainer: document.getElementById('days'),
        nextDay: document.querySelector('.habbit__day'),
    },
    popup: {
        index: document.getElementById('add-habbit-popup'),
        iconField: document.querySelector('.popup__form input[name="icon"]')
    }
}

/* utils */

function loadData() {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    const habbitArray = JSON.parse(habbitsString);
    if (Array.isArray(habbitArray)) {
        habbits = habbitArray;
    }
}

function saveData() {
    localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

function togglePopup() {
    if (page.popup.index.classList.contains('cover_hidden')) {
        page.popup.index.classList.remove('cover_hidden');
    } else {
        page.popup.index.classList.add('cover_hidden');
    }
}

function resetForm(form, fields) {
    for (const field of fields) {
        form[field].value = '';
    }
}

function validateForm(form, fields) {
    const formData = new FormData(form);
    const res = {};
    for (const field of fields) {
        const fieldValue = formData.get(field);
        form[field].classList.remove('error');
        if (!fieldValue) {
            form[field].classList.add('error');
        }
        res[field] = fieldValue;
    }
    let isValid = true;
    for (const field of fields) {
        if (!res[field]) {
            isValid = false;
        }
    }
    if (!isValid) {
        return;
    }
    return res;
}

/* render */

function rerenderMenu(activeHabbit) {
    page.menu.innerHTML = '';
    for (const habbit of habbits) {
        const isActive = activeHabbit.id === habbit.id;
        const element = document.createElement('div');
        element.classList.add('menu__item-container');
        element.innerHTML = `
            <div class="menu__item-wrapper ${isActive ? 'menu__item-wrapper-active' : ''}">
                <button menu-habbit-id="${habbit.id}" class="menu__item">
                    <img src="/images/${habbit.icon}.svg" alt="${habbit.name}" />
                </button>
                <button class="menu__item-delete ${isActive ? '' : 'hidden'}" onclick="deleteHabbit(${habbit.id})">
                    <span class="delete-icon">
                        <img src="/images/close.svg" alt="Удалить привычку" />
                    </span>
                </button>
            </div>
        `;
        element.querySelector('.menu__item').addEventListener('click', () => rerender(habbit.id));
        page.menu.appendChild(element);
    }
}

function rerenderHead(activeHabbit) {
    page.header.h1.innerText = activeHabbit.name;
    const progress = activeHabbit.days.length / activeHabbit.target > 1
        ? 100
        : activeHabbit.days.length / activeHabbit.target * 100;
    page.header.progressPercent.innerText = progress.toFixed(0) + '%';
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`);
}

function rerenderContent(activeHabbit) {
    page.content.daysContainer.innerHTML = '';
    for (const index in activeHabbit.days) {
        const element = document.createElement('div');
        element.classList.add('habbit');
        element.innerHTML = `<div class="habbit__day">День ${Number(index) + 1}</div>
        <div class="habbit__comment"> ${activeHabbit.days[index].comment}</div>
        <button class="habbit__delete" onclick="deleteDay(${index})">
            <img src="images/delete.svg" alt="Удалить день" ${Number(index) + 1} />
        </button>`
        page.content.daysContainer.appendChild(element);
    }
    page.content.nextDay.innerHTML = `День ${activeHabbit.days.length + 1}`;
}

function rerender(activeHabbitId) {
    globalActiveHabbitId = activeHabbitId;
    const activeHabbit = habbits.find(habbit => habbit.id === activeHabbitId);
    if (!activeHabbit) {
        return;
    }
    document.location.replace(document.location.pathname + '#' + activeHabbitId);
    rerenderMenu(activeHabbit);
    rerenderHead(activeHabbit);
    rerenderContent(activeHabbit);
}

/* delete habbit */

function deleteHabbit(habbitId) {
    habbits = habbits.filter(habbit => habbit.id !== habbitId);
    saveData();
    if (habbits.length > 0) {
        rerender(habbits[0].id);
    } else {
        globalActiveHabbitId = null;
        page.header.h1.innerText = '';
        page.header.progressPercent.innerText = '0%';
        page.header.progressCoverBar.style.width = '0%';
        page.content.daysContainer.innerHTML = '';
        page.content.nextDay.innerHTML = '';
    }
}

/*  work with days*/

function addDays(event) {
    event.preventDefault();
    const data = validateForm(event.target, ['comment']);
    if (!data) {
        return;
    }
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            return {
                ...habbit,
                days: habbit.days.concat([{ comment: data.comment }],)
            }
        }
        return habbit;
    });
    resetForm(event.target, ['comment'])
    rerender(globalActiveHabbitId)
    saveData()
}

function deleteDay(index) {
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            habbit.days.splice(index, 1);
            return {
                ...habbit,
                days: habbit.days
            };
        }
        return habbit;
    });
    rerender(globalActiveHabbitId);
    saveData();
}

/* working with habbits */

function setIcon(context, icon) {
    page.popup.iconField.value = icon;
    const activeIcon = document.querySelector('.icon.icon_active');
    activeIcon.classList.remove('icon_active');
    context.classList.add('icon_active');
}

function addHabbit(event) {
    event.preventDefault();
    const data = validateForm(event.target, ['name', 'icon', 'target']);
    if (!data) {
        return;
    }
    const maxId = habbits.reduce((acc, habbit) => acc > habbit.id ? acc : habbit.id, 0);
    habbits.push({
        id: maxId + 1,
        name: data.name,
        target: data.target,
        icon: data.icon,
        days: []
    });
    resetForm(event.target, ['name', 'target']);
    togglePopup();
    saveData()
    rerender(maxId + 1);
}

/* init */

(() => {
    loadData();
    const hashId = Number(document.location.hash.replace('#', ''));
    const urlHabbitId = habbits.find(habbit => habbit.id === hashId);
    if(urlHabbitId) {
        rerender(urlHabbitId.id)
    } else {
        rerender(habbits[0].id)
    }
})();
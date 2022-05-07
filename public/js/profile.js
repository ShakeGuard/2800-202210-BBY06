"use strict";
const logoutButton = document.getElementById("Button-Logout");

logoutButton.onclick = async () => {
    const response = await fetch('/logout', {
        method: 'POST'
    });

    const status = await response.text();
    switch (status) {
        case 'logoutSuccessful':
            window.location.href = "./";
            break;
        default:
            break;
    }

};
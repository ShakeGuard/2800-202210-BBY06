"use strict";
// Client-Side

function ready(callback) {
    if (document.readyState != "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

// Detect #LOGIN button click, Make POST request TO THE SERVER
document.querySelector("#Button-Login").addEventListener("click", async function(e) {
    e.preventDefault();
    const email = document.getElementById("Email").value;
    const password = document.getElementById("Password").value;
    const response = await fetch("/login", {
        headers: {
            'Content-Type': 'application/json',
        },
        "method": "POST",
        "body": JSON.stringify({email, password})
    });
    
    // alexkonghockey@gmail.com
    // not_bacon

    const status = await response.text();

        switch (status) {
            case 'loginSuccessful':
                window.location.href = "./profile";
                break;
			case 'userNotFound':
			case 'passwordMismatch':
				document.getElementById("Error-Msg").innerText = "Invalid Email/Password";
				break;
            default:
                break;
        }

});

ready(function(){
    
})
"use strict";

const UpdateButton = document.getElementById("Update-Button");
const FullNameInput = document.getElementById("FullName");
const EmailInput = document.getElementById("Email");
const PasswordInput = document.getElementById("Password");
const Pen1 = document.getElementById("Pen-1");
const Pen2 = document.getElementById("Pen-2");
const Pen3 = document.getElementById("Pen-3");

async function executeUpdate(){
    console.log("Updating!");

    const response = await fetch("/profile", {
        method: "PATCH",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email:EmailInput.value})
    })

    const ResponseText = await response.text(); 

    switch(ResponseText){
        case "passwordMismatch":
            // Old Password not correct
            break;
        case "userUpdated":
            // Successfully updated
            break;
        case "emailInUse":
            // Email already in use.
            break;
        // case "invalidSession":
        //     break;
        // case "userNotFound":
        //     break;
        // case "missingBodyArgument(s)":
        //     break;
        // case "serverIssue":
        //     break;
        default:
            console.log(ResponseText);
    }

}

function clearInput(x){
    x.value = '';
}

function editFullName(){
    if (FullNameInput.disabled){
        FullNameInput.disabled= false; 
        FullNameInput.focus();;
        FullNameInput.onfocus = clearInput(FullNameInput);
    } else {
        FullNameInput.disabled= true; 
        FullNameInput.value = "FirstName LastName"
    }
}
function editEmail(){
    if (EmailInput.disabled){
        EmailInput.disabled= false; 
        EmailInput.focus();
        EmailInput.onfocus = clearInput(EmailInput);
    } else {
        EmailInput.disabled= true;
        EmailInput.value = "Email Address" 
    }
}
function editPasswordInput(){
    if (PasswordInput.disabled){
        PasswordInput.disabled= false; 
        PasswordInput.focus();
        PasswordInput.onfocus = clearInput(PasswordInput);
    } else {
        PasswordInput.disabled= true; 
        PasswordInput.value = "12345" 
    }
}

UpdateButton.addEventListener("click", executeUpdate, false);
Pen1.addEventListener("click",editFullName,false);
Pen2.addEventListener("click",editEmail,false);
Pen3.addEventListener("click",editPasswordInput,false);


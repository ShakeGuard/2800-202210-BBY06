"use strict";

const UpdateButton = document.getElementById("Update-Button");
const FullNameInput = document.getElementById("FullName");
const EmailInput = document.getElementById("Email");
const PasswordInput = document.getElementById("Password");
const Pen1 = document.getElementById("Pen-1");
const Pen2 = document.getElementById("Pen-2");
const Pen3 = document.getElementById("Pen-3");

let userName = FullNameInput.value;
let userEmail = EmailInput.value

const getProfileDetails = async() => {
	const response = await fetch('/profile-details');
	const responseJson = await response.json();
	FullNameInput.value = responseJson.name;
	EmailInput.value = responseJson.email;
	userName = FullNameInput.value;
	userEmail = EmailInput.value;
}

async function executeUpdate(){
	const payload = {};
	if(!FullNameInput.disabled && FullNameInput.value.length !== 0) {
		payload['name'] = FullNameInput.value;
	}
	if(!EmailInput.disabled) {
		payload['email'] = EmailInput.value;
	}
	if(!PasswordInput.disabled) {
		payload['pwd'] = PasswordInput.value;
	}


    const response = await fetch("/profile", {
        method: "PATCH",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
    })

    const ResponseText = await response.text(); 

    switch(ResponseText){
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
	getProfileDetails();
}

function clearInput(x){
    x.value = '';
}

function editFullName(){
    if (FullNameInput.disabled){
        FullNameInput.disabled= false; 
        FullNameInput.focus();
        FullNameInput.onfocus = clearInput(FullNameInput);
    } else {
        FullNameInput.disabled= true; 
        FullNameInput.value = userName;
    }
}
function editEmail(){
    if (EmailInput.disabled){
        EmailInput.disabled= false; 
        EmailInput.focus();
        EmailInput.onfocus = clearInput(EmailInput);
    } else {
        EmailInput.disabled= true;
        EmailInput.value = userEmail;
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

getProfileDetails();
UpdateButton.addEventListener("click", executeUpdate, false);
Pen1.addEventListener("click",editFullName,false);
Pen2.addEventListener("click",editEmail,false);
Pen3.addEventListener("click",editPasswordInput,false);


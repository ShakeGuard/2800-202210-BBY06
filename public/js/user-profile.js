"use strict";

const UpdateButton = document.getElementById("Update-Button");
const FullNameInput = document.getElementById("FullName");
const EmailInput = document.getElementById("Email");
const PasswordInput = document.getElementById("Password");
const AvatarInput = document.getElementById("Upload-Avatar");
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

const getAvatar = async() => {
	const response = await fetch('/avatar')
	try {
		const responseJson = await response.json();
		let base64 = responseJson.data;
		// TODO: Fix the weird stretching of the image
		base64 = `data:${responseJson.mimeType};base64,${base64}`;
		document.getElementById("Base-Container-ProfilePicture").src = base64;
	} catch(e) {
		console.log(e);
	}
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
	if(AvatarInput.files[0].size <= 8 * 1024 * 1024) {
		// Make the POST call seperatly
		const formData = new FormData();
		formData.append('avatar', AvatarInput.files[0])
		const response = await fetch("/avatar", {
			method: "POST",
			body: formData
		})
		const responseText = await response.text();
		console.log(responseText);
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
	getAvatar();
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

AvatarInput.addEventListener("change", function(e) {
	const file = this.files[0];
	const error = document.getElementById("Avatar-Error");
	if(file) {
		// Don't allow files larger than 8MB
		if(file.size > 8 * 1024 * 1024) {
			error.innerText = "Max file size is 8MB";
		} else {
			error.innerText = "";
		}		
	} else {
		error.innerText = "";
	}	
})
getAvatar();
getProfileDetails();
UpdateButton.addEventListener("click", executeUpdate, false);
Pen1.addEventListener("click",editFullName,false);
Pen2.addEventListener("click",editEmail,false);
Pen3.addEventListener("click",editPasswordInput,false);


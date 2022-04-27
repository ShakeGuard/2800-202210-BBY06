// Client-Side

function ready(callback) {
    if (document.readyState != "loading") {
        callback();
        console.log("ready state is 'complete'");
    } else {
        document.addEventListener("DOMContentLoaded", callback);
        console.log("Listener was invoked");
    }
}

ready(function(){

    // Checks to see if Client Scriptis loaded.
    console.log("Client Script Loaded.")

    function ajaxGET(url, callback) {

        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                //console.log('responseText:' + xhr.responseText);
                callback(this.responseText);

            } else {
                console.log(this.status);
            }
        }
        xhr.open("GET", url);
        xhr.send();
    }

    function ajaxPOST(url, callback, data) {

        let params = typeof data == 'string' ? data : Object.keys(data).map(
                function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
            ).join('&');
        console.log("params in ajaxPOST", params);

        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                //console.log('responseText:' + xhr.responseText);
                callback(this.responseText);

            } else {
                console.log(this.status);
            }
        }
        xhr.open("POST", url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
    }

    // POST TO THE SERVER
    document.querySelector("#LOGIN").addEventListener("click", function(e) {
        e.preventDefault();
        let email = document.getElementById("email");
        let password = document.getElementById("password");
        let queryString = "email=" + email.value + "&password=" + password.value;
        //console.log("data that we will send", email.value, password.value);

        ajaxPOST("/login", function(data) {

            if(data) {
                let dataParsed = JSON.parse(data);
                console.log(dataParsed);
                if(dataParsed.status == "fail") {
                    document.getElementById("errorMsg").innerHTML = dataParsed.msg;
                } else {
                    window.location.replace("/directory");
                }
            }
            //document.getElementById("errorMsg").innerHTML = dataParsed.msg;

        }, queryString);
    });

    ajaxPOST("/marketplace", function(data){
        //document.getElementById("grid-item-pokeMartTable").innerHTML = ;
    });

})
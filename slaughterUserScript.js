// ==UserScript==
// @name         Slaughter Spam
// @version      0.1
// @description  cut down email spammers where they stand
// @author       maxtheaxe
// @match        https://mail.google.com/mail/u/*/
// @icon         https://slaughter.app/assets/images/logo-13.png
// @grant        none
// ==/UserScript==

function deleteThread(threadID) {
	var requestOptions = {
		method: 'GET',
		redirect: 'follow'
	};

	var url = "https://script.google.com/macros/s/AKfycbxPLHCGnB3S09-3-PsFHtDIZzB2h_9rCPnnPXtIpsWgyRigfkVeRQWJcTsAYT32_pmQcA/exec" +
		`?id=${threadID}`

	fetch(url, requestOptions)
		.then(response => response.text())
		.then(result => console.log(result))
		.catch(error => console.log('error', error));
}

function addButtons() {
	// works, but google unloads these on scroll and causes crosshairs to be deleted
	let allEmails = Array.from(document.getElementsByTagName("tbody")[5].getElementsByTagName("tr"));
	// add slaughter trigger in each toolbar, capture thread ID in prep for appscript piece
	allEmails.forEach((thread) => {
		let toolbar = thread.querySelector("ul[role='toolbar']");
		// if we've already added a crosshair to this email, skip it
		if (thread.getElementsByClassName("slaughter-crosshair")[0]) {
			return; // apparently continue doesn't work in forEach loops
		}
		console.log("adding new crosshair");
		let threadID = thread.querySelector("span[data-legacy-thread-id]"
			).getAttribute("data-legacy-thread-id");
		// add button in existing toolbar that will fire the slaughter action
		let removeButton = document.createElement("img");
		// add useless class so we can easily find it later
		removeButton.className = "slaughter-crosshair bqX";
		removeButton.style = "opacity: 1";
		removeButton.src = "https://slaughter.app/assets/images/logo-button.png";
		removeButton.onclick = function(e){
			console.log(threadID); // will call appscript in future
			deleteThread(threadID);
			e.stopPropagation(); // stop onclick from registering and opening email
		};
		// thread.insertBefore(removeButton, toolbar.parentNode);
		toolbar.prepend(removeButton);
	});
}


function runScript() {
	addButtons();
}

// var numPaused = 0; // how many iterations the script hasn't removed any listings
var frequency = 1000; // how often the script removes listing
var t = setInterval(runScript, frequency); // filter listings every 10 seconds

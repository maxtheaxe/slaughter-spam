// button_injector.js for slaughter-spam by maxtheaxe

/**
 * receive solution from captcha relay
 */
function receiveSolution(response, threadID) {
    // console.log(`solution received from captcha relay: ${response.solution}`);
    // // input captcha solution into appropriate box in page
    // document.querySelector("input[name='captchaText']").value = response.solution;
	console.log(`successful? ${response.success}`);
	// use delete button in toolbar instead of deleting actual html element
	// (paired w appscript delete), so we can hijack
	// native "undo" popup for our own undo purposes
	if (response.success) {
		// not using :has selector as ff doesn't support
		let thread = document.querySelector(
			`tr span[data-legacy-thread-id="${threadID}"]`
			).parentNode.parentNode.parentNode;
		// click delete button in toolbar
		thread.querySelector("li[data-tooltip='Delete']").click();
		// popup: span "Conversation moved to Trash."
	}
}

/**
 * log errors to console
 */
function handleError(error) {
    console.log(`error from relay: ${error}`);
}

/**
 * send thread details to background script, handle response
 */
const killOrder = (threadID) => {
	console.log(`executing kill order on thread ${threadID}`);
    chrome.runtime.sendMessage({threadID: threadID}, response => {
        // if we didn't receive a response, we know there was a relay error
        if (!response) {
            console.error("error:", runtime.lastError.message);
        } try { // handle errors w response here, or func will continuously retry
            receiveSolution(response, threadID);
        } catch (error) {
            handleError(error);
        }
    });
}

/**
 * wait for inbox to be ready
 */
async function addButtons() {
	try {
		// works, but google unloads these on scroll and causes crosshairs to be deleted
		let allEmails = Array.from(document.getElementsByTagName(
			"tbody")[5].getElementsByTagName("tr"));
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
			// removeButton.onclick = function(e){
			// 	console.log(threadID); // will call appscript in future
			// 	// deleteThread(threadID);
			// 	window.open(endpoint +
			// 		`?id=${threadID}`, "_blank"); // to demo functionality, not actually workable like this
			// 	e.stopPropagation(); // stop onclick from registering and opening email
			// };
			removeButton.addEventListener("click",
				function() { killOrder(threadID) });
			toolbar.prepend(removeButton);
		});
		// function should re-call itself even if no error occurs, as gmail
		// deletes the buttons; use until better solution is identified
		setTimeout(function () {
            addButtons(); // calls self again
        }, 1000);
	} catch (error) { // continuously retry adding buttons (will error while loading)
        console.log(error);
        setTimeout(function () {
            addButtons(); // calls self again
        }, 1000);
    }
}

var endpoint = "https://script.google.com/macros/s/AKfycbyVB4hU1YjIZqM2ExJJ5ViT24Y9HTBqyv3wzTCFJ61uS9Wy4b_wDEfaz3AUt6CPb_Z15w/exec";
console.log("successfully injected captcha solver");
addButtons();
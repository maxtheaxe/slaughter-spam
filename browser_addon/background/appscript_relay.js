// appscript_relay.js for slaughter-spam by maxtheaxe
// needed because page settings block communication with endpoint from content script

/**
 * http get request using fetch api
 */
async function get(url, threadID) {
    let requestOptions = {
		method: "GET",
		redirect: "follow"
	};
	let fullURL = url + `?id=${threadID}`;

	return fetch(fullURL, requestOptions)
		.then(response => response.text())
		.then(result => console.log(result))
		.catch(error => console.log("error", error));
}

function asyncOpenBackgroundTab(url, threadID) {
    let fullURL = url + `?id=${threadID}`;
    return new Promise((resolve, reject) => {
        chrome.tabs.create({url: fullURL, active: false}, tab => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError));
            } else {
                resolve(tab);
            }
        });
    });
}


async function openBackgroundTab(url, threadID) {
    let fullURL = url + `?id=${threadID}`;
    chrome.tabs.create({url: fullURL, active: false});
}


// chrome needs a listener to return "true" for it to recognize that a given
// response is asynchronous, but if the listener itself is an async func,
// it'll respond with a promise, so instead, we need to wrap the handler in
// an async function (https://stackoverflow.com/a/74777631/4513452)
/**
 * async wrapper for listener logic, allows sending proper response
 */
const handleRelay = async function (threadID, sendResponse) {
    // const response = await get(
    //     "https://script.google.com/macros/s/AKfycbyVB4hU1YjIZqM2ExJJ5ViT24Y9HTBqyv3wzTCFJ61uS9Wy4b_wDEfaz3AUt6CPb_Z15w/exec",
    //     threadID
    // );
    let url = "https://script.google.com/macros/s/AKfycbyVB4hU1YjIZqM2ExJJ5ViT24Y9HTBqyv3wzTCFJ61uS9Wy4b_wDEfaz3AUt6CPb_Z15w/exec";
    // https://stackoverflow.com/a/48897515/4513452
    let tab = await asyncOpenBackgroundTab(url, threadID);
    console.log(`tab opened: ${tab.id}`);
    // add evaluation logic to see if request actually worked
    // sendResponse({ success: true});
};

var targetTab = null;
console.log("appscript relay online");

/**
 * relay image data to server and then result back to content script
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // verify that this message is intended for self and not other script/listener
    if (!request.threadID) {
        return; // not for self
    }
    targetTab = sender.tab.id; // save sender tab as most recent inbox slaughter context
    console.log(request.threadID);
    console.log("relaying threadID to server...");
    handleRelay(request.threadID, sendResponse);
    // without returning true, sendResponse gets called synchronously
    // https://developer.chrome.com/docs/extensions/mv3/messaging/
    return true;
});

/**
 * receive results of slaughter event, perform next steps
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (targetTab !== null) {
        return; // somehow script was run without being triggered from inbox tab
    }
    // verify that this message is intended for self and not other script/listener
    if (request.validation === null) {
        return; // not for self
    } else if (request.validation) { // if request was successful, close the tab
        chrome.tabs.remove(sender.tab.id);
        const sending = chrome.tabs.sendMessage(targetTab, {success: true});
    } else if (request.validation === false) {
        console.log("something went wrong, please inspect the request tab");
        const sending = chrome.tabs.sendMessage(targetTab, {success: false});
    }
    else if (request.focus) { // if login prompt shows up, needs user input
        chrome.tabs.update(sender.tab.id, {"active":true}, (tab) => { });
    }
    console.log(request);
    // without returning true, sendResponse gets called synchronously
    // https://developer.chrome.com/docs/extensions/mv3/messaging/
    return true;
});

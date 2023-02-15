// validator.js for slaughter-spam by maxtheaxe

async function successChecker() {
    try {
        console.log("checking for success...");
        let success = false;
        if (document.getElementsByTagName("pre")[0].textContent.includes(
            "successfully slaughtered thread"
        )) {
            success = true;
        }
        // send status of validation to appscript relay, which will pass along success
        // status to inbox content scripts
        chrome.runtime.sendMessage({validation: success, focus: false});
    } catch (error) { // continuously retry search for outcome (might take a sec to load)
        console.log(error);
        setTimeout(function () {
            successChecker(); // calls self again
        }, 1000);
    }
}

console.log("successfully injected validator");
successChecker();
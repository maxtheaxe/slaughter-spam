// worker_team.js for slaughter-spam by maxtheaxe
// allows service workers to be split into multiple scripts

try {
    console.log("workers—assemble!");
    importScripts("appscript_relay.js");
} catch (e) {
    console.log(e);
}
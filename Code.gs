function loadAddOn(event) {
  var accessToken = event.gmail.accessToken;
  var messageId = event.gmail.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var mailMessage = GmailApp.getMessageById(messageId);
  var from = mailMessage.getFrom();

  var action = CardService.newAction().setFunctionName('slaughterThread');

  var openDocButton = CardService.newTextButton()
      .setText("slaughter")
      .setOpenLink(
          CardService.newOpenLink().setUrl("https://developers.google.com/gmail/add-ons/"));

  var card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("My First Gmail Addon"))
      .addSection(CardService.newCardSection()
          .addWidget(CardService.newTextParagraph().setText("The email is from: " + from))
          .addWidget(openDocButton))
      .build();

  return [card];
}

//
// for validating thread IDs used for testing
//
function listThreads () {
  const foundThreads = Gmail.Users.Threads.list("me", {
    q: "from:*@guerrillamail.com"
  });

  Logger.log(foundThreads);

  for (let i = 0; i < foundThreads["threads"].length; i++) {
    Logger.log(`thread "${foundThreads["threads"][i].snippet}" has id: "${foundThreads["threads"][i].id}"\n`);
  }

}

//
// creates a filter to put all future emails
// from ${fromAddress} into trash
//
function createDeleteFilter (fromAddress) {

  // create a new filter object
  var filter = Gmail.newFilter();

  // make the filter activate when the from address is ${fromAddress}
  filter.criteria = Gmail.newFilterCriteria();
  filter.criteria.from = fromAddress;

  // add filter action (we'll tell gmail to trash these in the future)
  filter.action = Gmail.newFilterAction();
  // FUTURE: add setting to allow usage of spam tag instead of trash (not much diff)
  filter.action.addLabelIds=['TRASH']; // for some reason, gmail trashing happens via label

  // add the filter to the user's ('me') settings
  Gmail.Users.Settings.Filters.create(filter, "me");

}

function slaughterThread (threadID) {

  Logger.log(`slaughtering thread ${threadID}...`);

  // retrieve thread contents
  const selectedThread = Gmail.Users.Threads.get("me", threadID);

  // save target email
  var spammerEmail = null;

  Logger.log(`looping over ${selectedThread.messages.length} messages in the thread...`)

  // loop through messages until we find one not sent by current user (in case they've responded)
  selectedThread.messages.forEach((message) => {

    Logger.log("checking message...");

    // HANDLE SITUATIONS IN WHICH SOMEONE TRIES TO USE THIS ON ACTUALLY ACTIVE THREADS OR GROUP EMAILS

    var messageHeaders = message.payload.headers;

    // identify sender email for given message
    messageHeaders.forEach((header) => {
      if (header["name"] === "From") {
        senderEmail = header["value"].slice(1,-1); // slice off angle brackets
        Logger.log(`message sender: ${senderEmail}`);
      }
    });

    // Logger.log(`my email: ${Session.getActiveUser().getEmail()}`);

    // if sender email is not active user, save it (it's likely spammer's email)
    if (senderEmail !== Session.getActiveUser().getEmail()) {
      spammerEmail = senderEmail;
      Logger.log(`found spammer email: ${spammerEmail}`); // for testing purposes
    } else {
      Logger.log("user sent current message; checking next one in thread");
    }
  });

  // if spammerEmail is still null, something went wrong
  if (spammerEmail === null) {
    Logger.log("no spammer email found, exiting");
    return
  }

  // delete target thread, now that we've collected the details we need
  Gmail.Users.Threads.trash("me", threadID);
  // Logger.log(`would normally delete thread id: ${threadID}`);

  try {
    // create the filter to delete future emails from this spammer
    createDeleteFilter(spammerEmail);
  } catch (err) {
    if ((err.name === "GoogleJsonResponseException") && (err.message.includes("Filter already exists"))) {
      Logger.log("filter already exists, just deleting target thread");
    }
  }

}

function main () {
  slaughterThread("184c8c8675005c5f");
  // listThreads();
}

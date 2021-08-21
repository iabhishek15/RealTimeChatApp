const socket = io();
const userDisplay = document.getElementById("users");
var conversation = document.getElementById("conversation");
var sendMessage = document.getElementById("sendMessage");
let signout = document.getElementById("signout");
let searchFriend = document.getElementById("searchFriend");
let showSearch = document.getElementById("showSearch");
let myModal = document.getElementById("myModal");
let username = document.getElementById("username").innerHTML;
let currentTalk = document.getElementById("currentTalk");

//sending message
sendMessage.addEventListener("click", function (e) {
  if (currentTalk.innerText.length == 0) return;
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  if (message.length == 0) return;
  Message = {
    text: message,
    sender: username.trim(),
    receiver: currentTalk.innerText.trim(),
  };
  socket.emit("message", Message);
  let date = new Date();
  let time = date.getDate() + "/" + date.getDay() + "/" + date.getFullYear();
  conversation.innerHTML += displayMessage("sender", message, time);
  conversation.scrollTop = conversation.scrollHeight;
  messageInput.value = "";
  messageInput.focus();
});

socket.on("otherMessage", function (message) {
  // conversation.innerHTML += displayMessage("receiver", message, "sun");
  conversation.scrollTop = conversation.scrollHeight;
});

//Searching friend on the key press
searchFriend.addEventListener("keydown", function (e) {
  showSearch.innerHTML = "";
  if (!e) e = window.event;
  var keyCode = e.code || e.key;
  if (keyCode == "Enter") {
    socket.emit("searchFriend", searchFriend.value);
  }
});

//checking if the friend exits or not
socket.on("FriendExists", (exits) => {
  if (exits) {
    showSearch.innerHTML = `<br><br>
    <button class = 'btn btn-primary' id = 'friendRequest' onclick = 'addFriend()'>Send Friend Request</button>`;
  } else {
    showSearch.innerHTML = "<br><br>No such user exits";
  }
});

//adding friend
function addFriend() {
  //this make no changes
  let friendRequest = document.getElementById("friendRequest");
  friendRequest.value = "Request Sent";

  socket.emit("friendRequest", {
    me: username.trim(),
    friend: searchFriend.value.trim(),
  });
}

socket.on("AddFriendRequest", (user) => {
  //here we will add the friend request in real time to the div element
});

function chatNow(TalkToUser) {
  conversation.innerHTML = "";
  currentTalk.innerText = TalkToUser;
  socket.emit("friendTalkHistory", {
    user1: username.trim(),
    user2: currentTalk.innerText.trim(),
  });
}

//using the socket.on function inside the above function was causing it to run multiple times
socket.on("userChatHistory", (chat) => {
  displayChat(chat);
});

function displayChat(chatMessages) {
  //console.log(chatMessages);
  chatMessages.map((chat) => {
    if (chat.sender == username.trim()) {
      conversation.innerHTML += displayMessage("sender", chat.text, chat.time);
    } else {
      conversation.innerHTML += displayMessage(
        "receiver",
        chat.text,
        chat.time
      );
    }
    conversation.scrollTop = conversation.scrollHeight;
  });
}

function displayMessage(user, message, time) {
  //sender //receiver
  return `
  <div class="row message-body">
    <div class="col-sm-12 message-main-${user}">
      <div class="${user}">
        <div class="message-text">
          ${message}
        </div>
        <span class="message-time pull-right">
          ${time}
        </span>
      </div>
    </div>
  </div>
  `;
}

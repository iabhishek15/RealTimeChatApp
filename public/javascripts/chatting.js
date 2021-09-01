const socket = io();
const userDisplay = document.getElementById("users");
var conversation = document.getElementById("conversation");
var sendMessage = document.getElementById("sendMessage");
let signout = document.getElementById("signout");
let searchFriend = document.getElementById("searchFriend");
let showSearch = document.getElementById("showSearch");
let myModal = document.getElementById("myModal");
let username = document.getElementById("username").innerHTML.trim();
let currentTalk = document.getElementById("currentTalk");

function acceptFriendRequest(friend) {
  socket.emit("acceptFriendRequest", {
    user: username,
    friend: friend,
  });
  const request = document.getElementById(friend);
  request.style.display = "none";
}

function removeFriendRequest(friend) {
  socket.emit("removeFriendRequest", {
    user: username,
    friend: friend,
  });
  const request = document.getElementById(friend);
  request.style.display = "none";
}

//sending message
sendMessage.addEventListener("click", function (e) {
  if (currentTalk.innerText.length == 0) return;
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  if (message.length == 0) return;
  Message = {
    text: message,
    sender: username,
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
    socket.emit("searchFriend", searchFriend.value.trim());
  }
});

function checkingFriend() {
  const friend = document.getElementById("searchFriend");
  const friends = document.getElementsByClassName("friends");
  //console.log(typeof friends);
  //you are friend of yourself

  for (item of friends) {
    //console.log(typeof item.innerHTML, typeof friend.value);
    //console.log(item.innerHTML.trim(), friend.value.trim());
    if (item.innerHTML.trim() === friend.value.trim()) {
      //console.log(toString(item.innerHTML), toString(friend));
      return true;
    }
  }
  return false;
}

//checking if the friend exits or not
socket.on("FriendExists", (exits) => {
  const friend = document.getElementById("searchFriend");
  if (friend.value.trim() === username) {
    return (showSearch.innerHTML = `<br><br>
      <button class = 'btn btn-success disabled' >Already Friend</button>`);
  }
  if (exits) {
    //already friend
    //console.log(checkingFriend());
    if (checkingFriend()) {
      return (showSearch.innerHTML = `<br><br>
      <button class = 'btn btn-success disabled' >Already Friend</button>
      <button class = 'btn btn-danger' onclick = 'unfriend()'>Unfriend</button>`);
    }

    //send friend request if not sent
    //console.log("entering...");
    socket.emit("doesFriendRequestExist", {
      user: username,
      friend: friend.value.trim(),
    });
    //console.log("exiting...");
    return socket.on("friendRequestExits", (exits) => {
      console.log(exits);
      if (exits) {
        return (showSearch.innerHTML = `<br><br>
        <button class = 'btn btn-danger' id = 'friendRequest' onclick = 'deleteFriendRequest()'>Delete Friend Request</button>`);
      }
      return (showSearch.innerHTML = `<br><br>
      <button class = 'btn btn-primary' id = 'friendRequest' onclick = 'addFriend()'>Send Friend Request</button>`);
    });
    //cancel friend request
  } else {
    showSearch.innerHTML =
      "<br><br><button class = 'btn btn-info' disabled>No such user exits</button>";
  }
});

//adding friend
function addFriend() {
  //this make no changes
  socket.emit("friendRequest", {
    me: username,
    friend: searchFriend.value.trim(),
  });
  return (showSearch.innerHTML = `<br><br>
  <button class = 'btn btn-danger' id = 'friendRequest' onclick = 'deleteFriendRequest()'>Delete Friend Request</button>`);
}

socket.on("AddFriendRequest", (user) => {
  //here we will add the friend request in real time to the div element
});

function deleteFriendRequest() {
  //deleting the friend request
}

function unfriend() {
  //removing friend
}

function chatNow(TalkToUser) {
  conversation.innerHTML = "";
  currentTalk.innerText = TalkToUser;
  socket.emit("friendTalkHistory", {
    user1: username,
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
    if (chat.sender == username) {
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

const socket = io();
const userDisplay = document.getElementById('users');
var conversation = document.getElementById('conversation');
var sendMessage = document.getElementById('sendMessage');
let signout = document.getElementById('signout');
let searchFriend = document.getElementById('searchFriend');
let showSearch = document.getElementById('showSearch');
let myModal = document.getElementById('myModal');
let username = document.getElementById('username').innerHTML;
let currentTalk = document.getElementById('currentTalk');


sendMessage.addEventListener('click', function (e) {
  if (currentTalk.innerText.length == 0) return ;
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;
  if (message.length == 0) return ;
  Message = {
    text : message,
    sender : username.trim(),
    receiver : currentTalk.innerText.trim()
  }
  socket.emit('message', Message);
  conversation.innerHTML += displayMessage('sender', message, "sun");
  conversation.scrollTop = conversation.scrollHeight;
  messageInput.value = '';
  messageInput.focus();
});

socket.on('otherMessage', function (message) {
  conversation.innerHTML += displayMessage('receiver', message, "sun");
  conversation.scrollTop = conversation.scrollHeight;
});


signout.addEventListener('click', function () {
  //console.log('signing out');
});

searchFriend.addEventListener("keydown", function (e) {
  showSearch.innerHTML = '';
  if (!e) e = window.event;
  var keyCode = e.code || e.key;
  //console.log(keyCode);
  if (keyCode == 'Enter'){
    socket.emit('searchFriend', searchFriend.value);
  }
  //when using keydown make sure to use the different div for storing the result 
  //do not append the result in the same div
});


socket.on('FriendExists', exits => {
  //console.log(exits);
  if (exits) {
    showSearch.innerHTML = `
    <p>the username does exits<p>
    <button class = 'btn btn-primary' id = 'friendRequest' onclick = 'addFriend()'>Send Friend Request</button>`;
  }else {
    showSearch.innerHTML = 'no such user exits';
  }
});


function addFriend() {
  //console.log(username.trim(), searchFriend.value.trim());
  socket.emit('friendRequest', ({ 
    "me" : username.trim(),
    "friend" : searchFriend.value.trim()
  }));
}

socket.on('AddFriendRequest', user => {
 //console.log(user.sender, user.receiver);
 //console.log(user.receiver, username);
 //console.log('Is the request getting send');
 //console.log(username.trim, user.receiver);
 if(username.trim() == user.receiver) {
    //console.log('Do you want to be friend with ${user.sender} ??');
    if (confirm(`Do you want to be friend with ${user.sender} ??`)) {
      socket.emit('AddFriend', {
        user1 : user.sender,
        user2 : user.receiver
      });
    }
 }
});


function chatNow(TalkToUser) {
  conversation.innerHTML = '';
  currentTalk.innerText = TalkToUser;
  socket.emit('friendTalkHistory', {
    user1 : username.trim(),
    user2 : currentTalk.innerText.trim()
  });
}

//using the socket.on function inside the above function was causing it to run multiple times
socket.on('userChatHistory', chat => {
  displayChat(chat);
});

function displayChat(chatMessages) {
  console.log(chatMessages);
  chatMessages.map((chat) => {
    if (chat.sender == username.trim()) {
      conversation.innerHTML += displayMessage('sender', chat.text, chat.time);
    }else {
      conversation.innerHTML += displayMessage('receiver', chat.text, chat.time);
    }
    conversation.scrollTop = conversation.scrollHeight;
  })
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
  `
}

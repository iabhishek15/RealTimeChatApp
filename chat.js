function chatting(server) {
  const socketio = require("socket.io");
  const io = socketio(server);
  const mongoose = require("mongoose");
  const User = mongoose.model("User");
  const Message = mongoose.model("Message");

  io.on("connection", (socket) => {
    //console.log("A user has been connected");

    socket.on("removeFriendRequest", function (data) {
      removeFriendRequest(User, data.user, data.friend);
    });

    socket.on("acceptFriendRequest", function (data) {
      AddFriend(User, data.user, data.friend);
      AddFriend(User, data.friend, data.user);
      removeFriendRequest(User, data.user, data.friend);
    });

    socket.on("doesFriendRequestExist", function (data) {
      User.findOne(
        {
          username: data.friend,
        },
        function (err, user) {
          if (err) {
            console.log(err);
            return;
          }
          const friendRequest = user.friend_request;
          let res = false;
          friendRequest.forEach((request) => {
            if (request.friend === data.user) {
              res = true;
            }
          });
          return socket.emit("friendRequestExits", res);
        }
      );
    });

    socket.on("message", function (message) {
      //console.log(message);
      var personOne = message.sender;
      var personTwo = message.receiver;
      if (message.sender > message.receiver) {
        personTwo = message.sender;
        personOne = message.receiver;
      }
      Message.findOne(
        {
          personOne: personOne,
          personTwo: personTwo,
        },
        function (err, mess) {
          if (err) {
            console.log(err);
            return;
          }
          if (!mess) {
            createMessage(Message, message, personOne, personTwo);
            return;
          }
          let texts = mess.text;
          let date = new Date();
          let time =
            date.getDate() + "/" + date.getDay() + "/" + date.getFullYear();
          texts.push({
            sender: message.sender,
            receiver: message.receiver,
            text: message.text,
            time: time,
          });
          updateMessage(Message, mess._id, texts);
        }
      );
      socket.broadcast.emit("otherMessage", message.text);
    });

    socket.on("searchFriend", function (user) {
      User.findOne(
        {
          username: user,
        },
        function (err, user) {
          if (err) {
            console.log(err);
            return;
          }
          if (!user) {
            socket.emit("FriendExists", false);
            return;
          }
          socket.emit("FriendExists", true);
        }
      );
    });
    //Receving the user to send the friend request
    socket.on("friendRequest", (user) => {
      //saving the friend request in the database
      add_friend_request_to_database(User, user.me, user.friend);
      socket.broadcast.emit("AddFriendRequest", {
        receiver: user.friend,
        sender: user.me,
      });
    });

    // socket.on("AddFriend", (user) => {
    //   AddFriend(User, user.user1, user.user2);
    //   AddFriend(User, user.user2, user.user1);
    // });

    socket.on("friendTalkHistory", (user) => {
      var personOne = user.user1;
      var personTwo = user.user2;
      if (user.user1 > user.user2) {
        personTwo = user.user1;
        personOne = user.user2;
      }
      //console.log(personOne, personTwo);
      Message.findOne(
        {
          personOne: personOne,
          personTwo: personTwo,
        },
        function (err, data) {
          if (err) {
            console.log(err);
            return;
          }
          if (data == null) {
            return;
          }
          socket.emit("userChatHistory", data.text);
        }
      );
    });
  });
}
module.exports = chatting;

function AddFriend(User, user1, user2) {
  User.findOne(
    {
      username: user1,
    },
    function (err, user) {
      if (err) {
        console.log(err);
        return;
      }
      user.friends.push(user2);
      User.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            friends: user.friends,
          },
        },
        {
          upsert: false,
        }
      )
        .then((result) => {
          console.log(result);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  );
}

//creating the message
function createMessage(Message, message, personOne, personTwo) {
  const new_message = new Message();
  new_message.personOne = personOne;
  new_message.personTwo = personTwo;
  let date = new Date();
  let time = date.getDate() + "/" + date.getDay() + "/" + date.getFullYear();
  new_message.text.push({
    sender: message.sender,
    receiver: message.receiver,
    text: message.text,
    time: time,
  });
  new_message.save();
}
//updating the message
function updateMessage(Message, id, texts) {
  Message.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        text: texts,
      },
    },
    {
      upsert: false,
    }
  )
    .then((result) => {
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });
}

//adding the friend request to database
function add_friend_request_to_database(User, me, friend) {
  User.findOne(
    {
      username: friend,
    },
    function (err, user) {
      if (err) {
        console.log(err);
        return;
      }
      let newFriendRequest = [...user.friend_request];
      User.findOne(
        {
          username: me,
        },
        function (err, newUser) {
          if (err) {
            console.log(err);
            return;
          }
          newFriendRequest.push({
            friend: me,
            image: newUser.image,
          });
          User.updateOne(
            {
              _id: user._id,
            },
            {
              $set: {
                friend_request: newFriendRequest,
              },
            },
            {
              upsert: false,
            }
          )
            .then((result) => {
              console.log(result);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      );
    }
  );
}

function removeFriendRequest(User, me, friend) {
  User.findOne(
    {
      username: me,
    },
    function (err, user) {
      if (err) {
        console.log(err);
        return;
      }
      let newFriendRequest = [];
      user.friend_request.forEach((data) => {
        if (data.friend !== friend) {
          newFriendRequest.push(data);
        }
      });
      User.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            friend_request: newFriendRequest,
          },
        },
        {
          upsert: false,
        }
      )
        .then((result) => {
          console.log(result);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  );
}

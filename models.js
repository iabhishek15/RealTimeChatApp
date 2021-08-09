var mongoose = require('mongoose');

mongoose.model('User', new mongoose.Schema({
  username : String,
  passwordHash : String,
  image : {
    type : String,
    default : "uploads\\white.jpg" 
  },
  friends : []
}), 'users');

mongoose.model('Message', new mongoose.Schema({
  personOne : String,
  personTwo : String,
  text : [],
}), 'message');

//In user we create the array for all the users he has talked to which will be some id 
//these Id will be the id of the message and we can use the message to display

const mongoose = require('mongoose');

// we need mongoose schema
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  displayName: {
    type: String,
    required: true,
  },

    email: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },
},
  { timestamps: true }
);

// allows us to modify the json objected that gets converted from mongoDB record TO JSON obj
userSchema.set(
    'toJSON',{
        transform: (document, returnedObject) =>{
            delete returnedObject.password
        }
    }
)

// then we register the model with mongoose
const User = mongoose.model('User', userSchema);

// export the model
module.exports = User;

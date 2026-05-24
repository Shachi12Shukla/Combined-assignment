const mongoose = require("mongoose");
require("dotenv").config();


const connection_str = process.env.URI
mongoose.connect(connection_str)
    .then(() => console.log("db connected"))
    .catch( (err) => console.log("error connecting with db"));


// generate 6 digit invite code 
const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let code = "";

    for(let i = 0; i < 6; i++){
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
};

// Schemas

const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 6,
    },
    householdId: {
        default: null,
        type: mongoose.Types.ObjectId
    },
   },
   {
    timestamps: true
   }
);

const householdSchema = mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 30,
        required: true
    },
    
    inviteCode: {
        type: String,
        unique: true,
        minlength: 6,
        maxlength: 6,
        uppercase: true
    },

    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User"    // note
    },

    wasteScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
  },
   {
    timestamps: true
});

const itemSchema = mongoose.Schema({
    householdId: {
        type: mongoose.Types.ObjectId,
        required: true
    },

    addedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },

    name: {
        type: String,
        required: true
    },
    category:{
        type: String,
        enum: ["produce", "dairy", "meat", "pantry", "frozen", "other"]
    },
    quantity: {
        type: Number,
        default: 1
    },
    expiryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["fresh", "expiring-soon","expired", "used", "wasted"]
    }
 },
    
    {timestamps: true}
);


householdSchema.pre("save", async function () {
  if (this.inviteCode) return; // already exists

  let code;
  let exists = true;

  while (exists) {
    code = generateInviteCode();

    const existing = await householdModel.findOne({
      inviteCode: code,
    });

    if (!existing) exists = false;
  }

  this.inviteCode = code;
});



// Models 
const userModel = mongoose.model("user", userSchema);
const householdModel = mongoose.model("household", householdSchema);
const itemModel = mongoose.model("item", itemSchema);

module.exports = {
    userModel,
    householdModel,
    itemModel,
};




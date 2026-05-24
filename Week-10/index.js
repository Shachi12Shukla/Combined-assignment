const express = require("express");
const app = express();
app.use(express.json());

const {Authmiddleware} = require('./Authmiddleware');

const jwt = require('jsonwebtoken');
const {userModel, householdModel, itemModel} = require('./model');
const mongoose = require("mongoose");


app.listen(3000 , ()=> console.log("backend server started"));

// Authentication
app.post("/api/auth/register", async (req,res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        email:email
    });

    if(userExists){
        res.status(403).send("user already exists with this email. Try a new email");
        return;
    };

    const newUser = await userModel.create({
        name: name,
        password: password,
        email: email
    });

    res.status(201).json({
        id: newUser._id,
        message: "You have registered successfully"
    });
});

app.post("/api/auth/login", async (req,res) => {
    const email = req.body.email;
    const password = req.body.password;

    const registeredUser = await userModel.findOne({
        email: email,
        password: password
    });

    if(!registeredUser){
        res.status(405).send("You have not registered OR incorrect creds");
        return;
    };

    const token = await jwt.sign({
        userId: registeredUser._id
    },process.env.SECRET);

    res.json({
        token: token,
        id: registeredUser._id,
        message: "Loggedin successfully"
    });
});


// Households
app.post("/api/households", Authmiddleware , async (req,res) => {
    const userId = req.userId;

    const newHousehold = await householdModel.create({
        name: req.body.name
    });

    res.status(203).send("household created");
});

app.post("/api/households/join", Authmiddleware , async (req,res) => {

    const userId =  req.userId;
    const inviteCode = req.body.inviteCode;

    const household = await householdModel.findOne({inviteCode});

   if(!household){
    res.status(404).send("Invalid invite code");
    return;
   }

    // add member (join)
    household.members.push(userId);
    await household.save();
    
    // update user collection
    const user = await userModel.findById(userId);
    user.householdId = household._id;
    await user.save();

    res.status(200).send("You have joined the household");

});

app.get("/api/households/me", Authmiddleware , async (req,res)=> {
    const userId = req.userId;

    const user = await userModel.findById(userId);

    const householdId =  user.householdId;

    if(householdId === null){
        return res.status(404).send("You don't own any household");
    }

    const household = await householdModel.findById(householdId);

    res.status(200).json({
        Household: household
    });
});


app.get("/api/households/:id/members", Authmiddleware , async (req,res)=> {
    const userId = req.userId;

    const householdId = req.params.id;

    const household = await householdModel.findById(householdId);

    const members = await Promise.all( household.members.map(async (memberId) => {
            const user = await userModel.findById(memberId);
    
            return {
                id : user._id,
                username: user.name
            };
        })
    );

    res.status(200).json({
        members : members
    });



});



// Items
app.get("/api/items", Authmiddleware , async (req,res) => {
    const userid = req.userId;
    const status = req.query.status;
    const category = req.query.category;

    const user = await userModel.findById(userid);

    const householdId = user.householdId;
    if(householdId === null){
        res.status(404).send("You don't own any household");
        return;
    };

    const item = await itemModel.findOne({householdId: householdId, status: status, category: category});

    if(!item){
        res.status(404).send("no such item found!");
        return;
    }

    res.status(200).json({Item: item});

});

app.post("/api/items", Authmiddleware, async (req,res)=> {
    const userId = req.userId;
    
    const name = req.body.name;
    const householdId = req.body.householdId;
    const category = req.body.category;
    const quantity = req.body.quantity;
    const expiryDate = req.body.expiryDate;
    const status = req.body.status;
    const addedBy = userId;

    const user = await userModel.findById(userId)

    if(user.householdId !== householdId){
        res.status(403).send("You can't add items because you do not have access of this household");
        return;
    };
    
    const item = await itemModel.create({
        addedBy,
        name,
        householdId,
        category,
        quantity,
        expiryDate,
        status,
    });

    res.status(201).json({
        message: "new item added!"
    });

});

// middleware needed - put, patch, and delete
// checks for access of household/item
app.put("/api/items/:id", Authmiddleware , async (req,res)=> {

    const userId = req.userId;
    const itemId = req.params.id;

    const item = await itemModel.findById(itemId);
    console.log(item);  // null
    if(!item){
        res.status(404).send("no item with this id exists");
        return;
    };

    const user = await userModel.findById(userId);
    console.log(user.householdId);
    console.log(item.householdId);
    if(user.householdId !== item.householdId){
        res.status(403).send("You don't  have access to update this item");
        return;
    };

    // const Oldname = req.body.Oldname;
    // const Oldcategory = req.body.Oldcategory;
    // const Oldquantity = req.body.Oldquantity;
    // const OldexpiryDate = req.body.OldexpiryDate;
    // const Oldstatus = req.body.Oldstatus;

    const Newname = req.body.Newname;
    const Newcategory = req.body.Newcategory;
    const Newquantity = req.body.Newquantity;
    const NewexpiryDate = req.body.NewexpiryDate;
    const Newstatus = req.body.Newstatus;

    
    item.name = Newname;
    item.category = Newcategory;
    item.quantity = Newquantity;
    item.expiryDate = NewexpiryDate;
    item.status = Newstatus;
    await item.save();

    res.status(200).send("item details updated");

});

app.patch("/api/items/:id/status", Authmiddleware , async (req,res) => {
    const userId = req.userId;
    const itemId = req.params.id;

    const item = await itemModel.findById(itemId);
    if(!item){
        res.status(404).send("no item with this id exists");
        return;
    };

    const user = await userModel.findById(userId);

    console.log(user.householdId);
    console.log(item.householdId);

    if(user.householdId != item.householdId){
        res.status(403).send("You don't  have access to update this item");
        return;
    };

    const status = req.body.status;

    item.status = status;
    await item.save();

    res.status(200).send("item status updated");
    
});

app.delete("/api/items/:id", Authmiddleware , async (req,res)=> {
    const userId = req.userId;
    const itemId = req.params.id;

    const item = await itemModel.findById(itemId);
    if(!item){
        res.status(404).send("no item with this id exists");
        return;
    };

    const user = await userModel.findById(userId);
    if(user.householdId != item.householdId){
        res.status(403).send("You don't  have access to delete this item");
        return;
    };

    const deletedItem = await itemModel.delete(item);
    res.status(200).send("Item deleted!");

});


// Dashboard
app.get("/api/dashboard/stats", Authmiddleware , async (req,res)=> {
    const userId = req.userId;
});

app.get("/api/dashboard/expiring", Authmiddleware , async (req,res)=> {
    const userId = req.userId;
});




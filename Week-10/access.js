const {userModel, householdModel, itemModel} = require('./model');

async function accessMiddleware(req,res,next){
    const userId = req.userId;
    const itemId = req.params.id;

    const item = await itemModel.findById(itemId);
    if(!item){
        res.status(404).send("no item with this id exists");
        return;
    };

    const user = await userModel.findById(userId);
    if(!item.householdId.equals(user.householdId)){
        res.status(403).send("You don't  have access to update this item");
        return;
    };

    req.item = item;
    req.itemId = itemId;

    next();
};

module.exports = {
    accessMiddleware
}
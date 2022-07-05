//jshint esversion:6
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const { redirect } = require("express/lib/response");
const date = require(__dirname + "/date.js");
const lodash=require('lodash');

const app = express();
mongoose.connect('mongodb+srv://KaranjitSaha:Kota%402020@cluster0.iytsg.mongodb.net/todolistDB').then(() => console.log("connected to DB successfully")).catch((err) => console.log(err));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "item not have name"],
  }
});

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: "Buy Milk"
});
const item2 = new Item({
  name: "Make Food"
});
const item3 = new Item({
  name: "Eat"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: [true, "list must have name"],
  },
  items: [itemSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({}, (err, foundItems) => {

    if (err) {
      console.log(err);
    }
    else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully inserted items");
        }
      });
      res.redirect('/');
    }
    else {
      console.log("Successfully found items");
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get('/:customListName', (req, res) => {
  let customListName = lodash.capitalize(req.params.customListName);
  console.log(customListName);
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (err) {
      console.log(err);
    }
    else if (foundList) {
      res.render("list", { listTitle: customListName, newListItems: foundList.items });
      console.log("list exists");
    }
    else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      console.log("list created");
      res.redirect('/' + customListName);
    }
  })
});

app.post("/", function (req, res) {
  var customListName = req.body.list;
  console.log(customListName);
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName
  });
  if (customListName === "Today") {
    item.save();
    res.redirect('/');
    console.log("Today");
  }
  else {
    List.findOne({
      name: customListName
    }, (err, foundList) => {
      if (err) {
        console.log(err);
      }
      else if (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + customListName);
      }
      else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log("list created");
        res.redirect('/' + customListName);
      }
    })
  }
});

app.post('/delete', (req, res) => {
  const removeItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(removeItemId, (err) => {
      if (err) {
        console.log("Cannot delete the item");
      }
      else {
        console.log("successfully removed from the list");
        res.redirect('/');
      }
    });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: removeItemId } } }, (err, foundList) => {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect('/' + listName);
      }
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});

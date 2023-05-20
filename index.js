const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Database connection succesful"))
.catch(error => console.log(error));

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Schema and Model
const userSchema = new Schema({
  username: String
});
const User = model("User", userSchema);

const exerciseSchema = new Schema({
  username: String,
  description: {type: String, require: true},
  duration: {type: Number, require: true},
  date: Date,
  user_id: { type: String, required: true},
});
const Exercise = model("Exercise", exerciseSchema);

//User Story 2-3
app.post("/api/users", async (req, res) => {
  const newUser = new User({ username: req.body.username});
  try {
    const user = await newUser.save();
    console.log(user);
    res.json(user);
  }catch (err) {
    console.log(err);
  }
});

//User Story 4,5,6
app.get("/api/users", async (req, res) => {
  const allUsers = await User.find({});
  console.log(allUsers);
  res.json(allUsers);
});

//User Story 7,8
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  const existingUser = await User.findById(id);
  console.log(date);

  const newExercise = new Exercise({ 
    username: existingUser.username,
    description,
    duration,
    date: date ? new Date(date.replace(/-/g, '\/')) : new Date(),
    user_id: existingUser._id
  });

  //Save to DB and reponse
  try {
    const exercise = await newExercise.save();
    res.json({
      _id: existingUser._id,
      username: existingUser.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    });

    // The snippet below updates the db users collection
    // userSchema.add( {description: String, duration: String, date: String} );
    // const updatedUser = await User.findByIdAndUpdate(req.params._id, 
    //   {description: newExercise.description, duration: newExercise.duration, date: newExercise.date},
    //   (err, result) => {
    //     if (err) console.log(err);
    //     console.log(result);
    //   }
    // );  

  } catch(err) {
    console.log(err);
  }

});

//User story 9
app.get("/api/users/:_id/logs", async (req, res, next) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user) {
    res.send("The requested userId does not exist");
    return;
  }

  let dateObj = {};
  if(from) {
    dateObj["$gte"] = new Date(from);
  }
  if(to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dateObj;
  }
  console.log(dateObj);
  console.log(filter);

  const exercises = await Exercise.find(filter).limit(+limit ?? 100);
  console.log(exercises);

  const logs = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  console.log(logs);

  res.json({
    username: user.username,  
    count: logs.length,
    _id: user._id,
    log: logs
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

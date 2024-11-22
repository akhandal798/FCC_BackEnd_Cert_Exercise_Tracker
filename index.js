const express = require('express')
const app = express()
const cors = require('cors')
const { default: mongoose } = require('mongoose')
const bodyParser = require('body-parser')
const { disabled } = require('express/lib/application')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//db connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//define schema
const userSchema = mongoose.Schema({
  username: String,
  id: String,
  exercises: [{
    description: String,
    date: String,
    duration: Number
  }]
})

const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  date: String,
  duration: Number,
  _id: String,
})

//Create models

const user = mongoose.model("user", userSchema)
const exercise = mongoose.model("exercise", exerciseSchema)

//bodyParser options
//all routes can use bodyParser now
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post("/api/users", async function (req, res) {
  const userInput = req.body.username;

  try {
    const temp = await user.create({username: userInput})
    const userID = temp._id.toString();
    return res.json({username: userInput, _id: userID})
  } catch (error) {
    console.log(error.message)
  }
  
  //console.log(req.body)
  //console.log({username: userInput, _id: userID})

})

//clear database on mongo before trying to pass this test
app.get("/api/users", async function (req, res) {
  
  try {
    const all_users = await user.find({}, 'username _id')
    return res.json(all_users)
  } catch (error) {
    console.log(error)
  }

})

app.post("/api/users/:_id/exercises", async function(req, res) {
  const id = req.params._id
  const description = req.body.description
  const duration = req.body.duration
  let date = req.body.date

  if (!date) {
    date = new Date().toISOString().substring(0, 10);
  }
  date = new Date(date).toDateString()

  let userFound;
  
  userFound = await user.findById(id)
  userFound.exercises.push({
    description: description,
    duration: Number(duration),
    date: date
  })
  //console.log(userFound.exercises)
  console.log(userFound.exercises.length)

  await userFound.save()
 
  const ret = {
    username: userFound.username, 
    description: description,
    duration: Number(duration),
    date: date,
    _id: id
  }
  
  res.json(ret)

})

app.get("/api/users/:_id/logs", async function(req, res) {
  const id = req.params._id
  const userFound = await user.findById(id)
  console.log(req.query.from)
  console.log(req.query.to)
  console.log(req.query.limit)

  let exercises = userFound.exercises
  if (req.query.from) {
    const fromDate = new Date(req.query.from);
    exercises = exercises.filter(exercise => new Date(exercise.date) >= fromDate);
  }

  if (req.query.to) {
    const toDate = new Date(req.query.to);
    exercises = exercises.filter(exercise => new Date(exercise.date) <= toDate);
  }

  if (req.query.limit) {
    exercises = exercises.slice(0, parseInt(req.query.limit));
  }

  //console.log(userFound)
  const ret = {
    username: userFound.username,
    count: userFound.exercises.length,
    _id: id,
    log: exercises
  }

  res.json(ret)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

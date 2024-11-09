require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const User = require("./models/User");
const session=require("express-session")
const cookieParser=require("cookie-parser")
const bodyParser = require("body-parser");
const bcrypt=require("bcrypt")
// const flash=require("connect-flash")
const PORT = process.env.PORT || 8000;
const app = express();



app.use(cookieParser())
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(flash())


mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB is connected"))
  .catch((err) => console.log("Error", err));

app.use(
  session({
    secret:process.env.SESSIONS_KEY,
    cookie:{maxAge:60000},
    resave:false,
    saveUninitialized:true,
  })
)


app.get("/", (req, res) => {
  res.render("Register");
});

app.get("/login", (req, res) => {
  const invalid_msg="email or password wrong"
  res.render("Login",{invalid_msg});
});

app.post("/", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      res.send("Email already registered. Please log in.");
      return res.redirect("/login")
    }
    const userData = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    await userData.save();
    res.redirect("/Login")
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).send("Error: Email already exists.");
    } else {
      res.status(500).send(`Error in saving data: ${err.message}`);
    }
  }
});

app.post("/login", async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      req.session.user=user
      res.cookie("sessionId",req.sessionID)
      if (!user) {
        
       return res.redirect("/login");
      }
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        res.send("error_msg", "Invalid email or password.");
        return res.redirect("/login");
      }
     
      res.redirect("home");
    } catch (err) {
      res.status(500).send(`Error during login: ${err.message}`);
    }
  });
function noCache(req, res, next) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
}
  app.get("/home", noCache, (req,res)=>{
    if (req.session.user) {
      res.render('home');
     } else {
      res.redirect('/login');
     }
  })
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error in session destroy');
        }
        res.redirect('/login');
    });
});


app.listen(PORT, () => {
  console.log("Server is running on http://localhost:8000");
});

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


const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
      next();
  } else {
      res.redirect("/login");
  }
};


app.get("/", (req, res) => {
 
  res.render("Register");
});

app.get("/login", (req, res) => {
  //  const error_msg=req.flash("error_msg")
  res.render("Login");
});

app.post("/", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      
      // req.flash("register_msg", "Email already registered. Please log in.");
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
        req.flash("error_msg", "Invalid email or password.");
       return res.redirect("/login");
      }
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        // req.flash("error_msg", "Invalid email or password.");
        return res.redirect("/login");
      }
      // req.flash("success_msg", "You are now logged in");
      res.redirect("home");
    } catch (err) {
      res.status(500).send(`Error during login: ${err.message}`);
    }
  });
  app.get("/home", isAuthenticated, (req,res)=>{
    res.render("home")
  })
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/login");
    });
});

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:8000");
});

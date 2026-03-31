require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const Category = require("./models/category");
const MongoStore = require("connect-mongo");
const connectDB = require("./config/db");
console.log("APP VERSION 2 - SESSION SECRET:", process.env.SESSION_SECRET);

const app = express();
require("./config/passport");

// mongodb configuration


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// admin route
const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ✅ FIXED SESSION CONFIG


connectDB().then(() => {
  console.log("DB connected, starting app...");

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "myfallbacksecret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        dbName: 'festdecor',
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 3,
        secure: true,
        sameSite: "none",
      },
    })
  );
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  app.listen(port, () => {
    console.log("Server running at port " + port);
  });
});

// global variables across routes
app.use(async (req, res, next) => {
  try {
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    res.locals.currentUser = req.user;
    const categories = await Category.find({}).sort({ title: 1 }).exec();
    res.locals.categories = categories;
    next();
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// add breadcrumbs
const get_breadcrumbs = function (url) {
  var rtn = [{ name: "Home", url: "/" }],
    acc = "",
    arr = url.substring(1).split("/");

  for (let i = 0; i < arr.length; i++) {
    acc = i != arr.length - 1 ? acc + "/" + arr[i] : null;
    rtn[i + 1] = {
      name: arr[i].charAt(0).toUpperCase() + arr[i].slice(1),
      url: acc,
    };
  }
  return rtn;
};

app.use(function (req, res, next) {
  req.breadcrumbs = get_breadcrumbs(req.originalUrl);
  next();
});

// routes config
const indexRouter = require("./routes/index");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/user");
const pagesRouter = require("./routes/pages");

app.use("/products", productsRouter);
app.use("/user", usersRouter);
app.use("/pages", pagesRouter);
app.use("/", indexRouter);

// catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

var port = process.env.PORT || 3001;
app.set("port", port);


module.exports = app;

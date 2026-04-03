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

// view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// basic middleware
app.use(logger("dev"));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// trust proxy (Render)
app.set("trust proxy", 1);

// connect DB FIRST
connectDB();

// session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "myfallbacksecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "festdecor",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 3,
      secure: true,
      sameSite: "none",
    },
  })
);

// passport
app.use(passport.initialize());
app.use(passport.session());
const adminRouter = require("./routes/admin");

app.use("/admin", adminRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// flash
app.use(flash());

// CSRF (IMPORTANT: AFTER session)
const csrf = require("csurf");
const csrfProtection = csrf();
// app.use(csrfProtection);
app.use((req, res, next) => {
  if (
    req.path.startsWith("/admin")    // ✅ skip admin
       // optional
  ) {
    return next();
  }
  csrfProtection(req, res, next);
});
// make csrf token available in views
app.use((req, res, next) => {
  if (typeof req.csrfToken === "function") {
    res.locals.csrfToken = req.csrfToken();
  } else {
    res.locals.csrfToken = null;
  }
  next();
});
// app.use((req, res, next) => {
//   if (req.path === "/checkout") return next(); // skip CSRF for Stripe
//   csrfProtection(req, res, next);
// });


// global variables
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
    next(error);
  }
});

// breadcrumbs
const get_breadcrumbs = function (url) {
  let rtn = [{ name: "Home", url: "/" }];
  let acc = "";
  let arr = url.substring(1).split("/");

  for (let i = 0; i < arr.length; i++) {
    acc = i !== arr.length - 1 ? acc + "/" + arr[i] : null;
    rtn[i + 1] = {
      name: arr[i].charAt(0).toUpperCase() + arr[i].slice(1),
      url: acc,
    };
  }
  return rtn;
};

app.use((req, res, next) => {
  req.breadcrumbs = get_breadcrumbs(req.originalUrl);
  next();
});

// routes
const indexRouter = require("./routes/index");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/user");
const pagesRouter = require("./routes/pages");

app.use("/products", productsRouter);
app.use("/user", usersRouter);
app.use("/pages", pagesRouter);
app.use("/", indexRouter);

// 404
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

// start server ONLY ONCE
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Server running at port " + port);
});

module.exports = app;
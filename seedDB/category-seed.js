const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Category = require("../models/category");

const mongoose = require("mongoose");
const connectDB = require("./../config/db");
connectDB();

async function seedDB() {
  async function seedCateg(titleStr, imageFile) {
    try {
      const categ = await new Category({ 
        title: titleStr,
        imagePath: imageFile  // Add image filename
      });
      await categ.save();
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  // router.post("/categories", upload.single("image"), async (req, res) => {
  //   try {
  //     const category = new Category({
  //       title: req.body.title,
  //       imagePath: req.file
  //         ? "/images/uploads/" + req.file.filename
  //         : "/images/no-image.jpg"
  //     });
  
  //     await category.save();
  //     res.redirect("/admin/categories"); // Or respond with JSON if using an API
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send("Error creating category");
  //   }
  // });
  
   

  async function closeDB() {
    console.log("CLOSING CONNECTION");
    await mongoose.disconnect();
  }
  await seedCateg("Backpacks");
  await seedCateg("Briefcases");
  await seedCateg("Mini Bags");
  await seedCateg("Large Handbags");
  await seedCateg("Travel");
  await seedCateg("Totes");
  await seedCateg("Purses");
  await closeDB();
}

seedDB();

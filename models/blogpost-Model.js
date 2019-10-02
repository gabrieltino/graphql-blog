const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogpostSchema = new Schema({
  title: String,
  authorId: String
});

module.exports = mongoose.model("BlogPost", blogpostSchema);

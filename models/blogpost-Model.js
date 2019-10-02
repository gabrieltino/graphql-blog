const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogpostSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("BlogPost", blogpostSchema);

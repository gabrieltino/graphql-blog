const express = require('express');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema/schema');
const mongoose = require("mongoose");

const app = express();

app.use(
  "/graphql",
  graphqlHTTP({
      schema,
    graphiql: true  
  })
);

const PORT = process.env.PORT || 5000;
mongoose
  .connect(
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@ds253857.mlab.com:53857/blog`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log("Mongoose connected...");
    app.listen(PORT, () => {
      console.log("server is running");
    });
  })
  .catch(err => {
    console.log(err);
  });
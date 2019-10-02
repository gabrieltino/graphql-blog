const graphql = require("graphql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user-Model");
const BlogPost = require("../models/blogpost-Model");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLID
} = graphql;

const BlogPostType = new GraphQLObjectType({
  name: "BlogPost",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    user: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.userId);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    Blogposts: {
      type: new GraphQLList(BlogPostType),
      resolve(parent, args) {
        return BlogPost.find({ userId: parent.id });
      }
    }
  })
});

const AuthDataType = new GraphQLObjectType({
  name: "AuthData",
  fields: () => ({
    userId: { type: GraphQLString },
    token: { type: GraphQLString },
    tokenExpiration: { type: GraphQLInt }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    BlogPost: {
      type: BlogPostType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args, req) {
        if (!req.isAuth) {
          throw new Error("Unauthenticated!");
        }
        return BlogPost.findById(args.id);
      }
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return User.findById(args.id);
      }
    },
    Blogposts: {
      type: new GraphQLList(BlogPostType),
      resolve(parent, args, req) {
        if (!req.isAuth) {
          throw new Error("Unauthenticated!");
        }
        return BlogPost.find({});
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return User.find({});
      }
    },
    login: {
      type: AuthDataType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString }
      },
      async resolve(parent, args) {
        const user = await User.findOne({ email: args.email });
        if (!user) {
          throw new Error("User does not exist");
        }
        const isEqual = await bcrypt.compare(args.password, user.password);
        if (!isEqual) {
          throw new Error("Passwords do not match");
        }
        const token = jwt.sign(
          { userId: user.id, email: user.email, username: user.username },
          "fuckwithitwhileyoucan",
          {
            expiresIn: "1h"
          }
        );
        return {
          userId: user.id,
          token: token,
          tokenExpiration: 1
        };
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createUser: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        name: { type: GraphQLString },
        username: { type: GraphQLString }
      },
      async resolve(parent, args) {
        try {
          const findEmail = await User.findOne({ email: args.email });
          if (findEmail) {
            throw new Error("Email already exists.");
          }
          const findName = await User.findOne({ name: args.name });
          if (findName) {
            throw new Error("Name already exists.");
          }
          const findUsername = await User.findOne({ username: args.username });
          if (findUsername) {
            throw new Error("Username exists already.");
          }
          let hashedPassword = await bcrypt.hash(args.password, 12);
          let newuser = new User({
            email: args.email,
            password: hashedPassword,
            name: args.name,
            username: args.username
          });
          const result = await newuser.save();
          let getresult = await result;
          return { ...getresult._doc, password: null };
        } catch (err) {
          throw err;
        }
      }
    },
    createBlogPost: {
      type: BlogPostType,
      args: {
        title: { type: GraphQLString },
        userId: { type: GraphQLID }
      },
      async resolve(parent, args, req) {
        if (!req.isAuth) {
          throw new Error("Unauthenticated!");
        }
        const findPost = await BlogPost.findOne({ title: args.title });
          if (findPost) {
            throw new Error("BlogPost already exists.");
          }
          let blogpost = new BlogPost({
            title: args.title,
            userId: req.userId
          });
          return blogpost.save();
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});

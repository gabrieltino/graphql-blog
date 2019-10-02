const graphql = require("graphql");
const bcrypt = require("bcryptjs");
const BlogPost = require("../models/blogpost-Model");
const User = require("../models/user-Model");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLID
} = graphql;

const BlogPostType = new GraphQLObjectType({
  name: "Post",
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
      resolve(parent, args) {
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
      resolve(parent, args) {
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
      resolve(parent, args) {
        const user = User.findOne({ email: args.email });
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
        } catch(err) {
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
      resolve(parent, args) {
        let blogpost = new BlogPost({
          title: args.title,
          userId: args.userId
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

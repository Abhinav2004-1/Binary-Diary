import mongoose from "mongoose";

const Schema = new mongoose.Schema({
  Username: {
    type: String,
    required: true,
  },

  Password: {
    type: String,
    required: true,
  },

  Phone: {
    type: Number,
    required: true,
  },

  RegistrationDate: {
    type: String,
    default: new Date(parseInt(Date.now())).toLocaleDateString(),
  },

  ProfilePicture: {
    type: String,
    data: Buffer,
    default: "",
  },

  Bio: {
    type: String,
    default: "",
  },

  DOB: {
    type: String,
    default: "",
  },

  Following: {
    type: [String],
    default: [],
  },

  Followers: {
    type: [String],
    default: [],
  },

  LikedPosts: {
    type: [String],
    default: [],
  },

  Posts: {
    type: [
      {
        PostID: { type: String },
        CreationDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },

  Requests: {
    type: String,
    required: true
  },

  UniqueID: {
    type: String,
    required: true,
  },
});

export const RegisterModel = mongoose.model("RegisterModel", Schema);

const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    language: {
      type: String,
      required: true,
      enum: ['c', 'cpp', 'python', 'java'],
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

snippetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Snippet', snippetSchema);

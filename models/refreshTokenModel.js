import mongoose from "mongoose";

const refreshTokenSchema = mongoose.Schema(
  {
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;

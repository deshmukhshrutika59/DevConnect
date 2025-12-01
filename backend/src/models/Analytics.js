import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  profileViews: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 1 }
    }
  ],

  connectionEvents: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 1 }
    }
  ],
  insightsCache: {
    insights: [String],
    updatedAt: Date
  }
  
});

export default mongoose.model("Analytics", analyticsSchema);

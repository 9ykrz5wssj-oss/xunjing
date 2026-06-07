import mongoose, { Document, Schema } from "mongoose";
import { ParticipantStatus } from "../config/constants";

export interface IEventParticipant extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "host" | "participant";
  status: ParticipantStatus;
  appliedAt: Date;
  respondedAt: Date | null;
  exitedAt: Date | null;
}

const EventParticipantSchema = new Schema<IEventParticipant>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["host", "participant"], required: true },
    status: {
      type: String,
      enum: Object.values(ParticipantStatus),
      required: true,
    },
    appliedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    exitedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

EventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventParticipantSchema.index({ userId: 1, status: 1 });
EventParticipantSchema.index({ eventId: 1, status: 1 });

export const EventParticipant = mongoose.model<IEventParticipant>(
  "EventParticipant",
  EventParticipantSchema
);

import mongoose, { Document, Schema } from "mongoose";
import { Campus, ActivityStatus } from "../config/constants";

export interface IEvent extends Document {
  hostId: mongoose.Types.ObjectId;
  typeId: mongoose.Types.ObjectId;
  title: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  campus: Campus;
  locationText: string;
  meetCoordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  status: ActivityStatus;
  currentParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    typeId: { type: Schema.Types.ObjectId, ref: "EventType", required: true },
    title: { type: String, default: "默认主题", maxlength: 100 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 2 },
    campus: { type: String, enum: Object.values(Campus), required: true },
    locationText: { type: String, required: true, maxlength: 100 },
    meetCoordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    description: { type: String, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(ActivityStatus),
      default: ActivityStatus.RECRUITING,
    },
    currentParticipants: { type: Number, default: 1 },
  },
  { timestamps: true }
);

EventSchema.index({ hostId: 1, status: 1 });
EventSchema.index({ status: 1, startTime: 1, endTime: 1 });
EventSchema.index({ campus: 1, status: 1 });

export const Event = mongoose.model<IEvent>("Event", EventSchema);

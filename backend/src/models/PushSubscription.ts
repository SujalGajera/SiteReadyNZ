// src/models/PushSubscription.ts — Mongoose model for browser push subscriptions
// When a user grants notification permission, the browser creates a PushSubscription
// object. We store it here so the server can send notifications at any time,
// even when the user is not actively looking at the app.

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: Types.ObjectId; // The user this subscription belongs to
  endpoint: string;       // The push service URL provided by the browser
  keys: {
    p256dh: string; // Encryption key — required by the VAPID spec
    auth: string;   // Authentication secret — required by the VAPID spec
  };
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    endpoint: {
      type: String,
      required: [true, 'Push endpoint is required'],
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, 'p256dh encryption key is required'],
      },
      auth: {
        type: String,
        required: [true, 'Auth secret is required'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — one subscription record per user+endpoint combination.
// A user may have multiple devices, each with its own endpoint, but we don't
// want duplicate records for the same device.
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema
);

export default PushSubscription;

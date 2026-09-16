import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    unit?: string;
}

export interface IStatusHistory {
    status: string;
    note?: string;
    timestamp: Date;
}

export interface IOrder extends Document {
    id: string;
    userId: mongoose.Types.ObjectId | string;
    items: IOrderItem[];
    shippingAddress: any;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    status: string;
    statusHistory: IStatusHistory[];
    deliveryPartnerId?: mongoose.Types.ObjectId | string | null;
    deliveryOtp?: string;
    liveLocation?: { lat: number; lng: number; updatedAt?: Date } | null;
    isPaid?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>(
    {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        items: { type: Schema.Types.Mixed, required: true },
        shippingAddress: { type: Schema.Types.Mixed, required: true },
        paymentMethod: { type: String, default: "card" },
        subtotal: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: { type: String, default: "Placed" },
        statusHistory: { type: [statusHistorySchema], default: [] },
        deliveryPartnerId: { type: Schema.Types.ObjectId, ref: "DeliveryPartner", default: null },
        deliveryOtp: { type: String, default: "" },
        liveLocation: { type: Schema.Types.Mixed, default: null },
        isPaid: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: any) => {
                ret.id = ret._id ? ret._id.toString() : ret.id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_doc, ret: any) => {
                ret.id = ret._id ? ret._id.toString() : ret.id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

orderSchema.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true,
});

orderSchema.virtual("deliveryPartner", {
    ref: "DeliveryPartner",
    localField: "deliveryPartnerId",
    foreignField: "_id",
    justOne: true,
});

export const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;

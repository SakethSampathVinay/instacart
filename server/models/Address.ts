import mongoose, { Document, Schema } from "mongoose";

export interface IAddress extends Document {
    id: string;
    userId: mongoose.Types.ObjectId | string;
    label: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
    lat: number;
    lng: number;
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        label: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
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

export const Address = mongoose.model<IAddress>("Address", addressSchema);
export default Address;

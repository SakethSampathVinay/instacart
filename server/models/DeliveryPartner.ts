import mongoose, { Document, Schema } from "mongoose";

export interface IDeliveryPartner extends Document {
    id: string;
    name: string;
    email: string;
    password?: string;
    phone: string;
    avatar?: string;
    vehicleType?: string;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const deliveryPartnerSchema = new Schema<IDeliveryPartner>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        avatar: { type: String, default: "" },
        vehicleType: { type: String, default: "bike" },
        isActive: { type: Boolean, default: true },
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

export const DeliveryPartner = mongoose.model<IDeliveryPartner>("DeliveryPartner", deliveryPartnerSchema);
export default DeliveryPartner;

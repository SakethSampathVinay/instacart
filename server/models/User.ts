import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    id: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        phone: { type: String, default: "" },
        avatar: { type: String, default: "" },
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

userSchema.virtual("addresses", {
    ref: "Address",
    localField: "_id",
    foreignField: "userId",
});

userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "userId",
});

export const User = mongoose.model<IUser>("User", userSchema);
export default User;

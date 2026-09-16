import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    unit?: string;
    stock?: number;
    isOrganic?: boolean;
    rating?: number;
    reviewCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        price: { type: Number, required: true },
        originalPrice: { type: Number, default: 0 },
        image: { type: String, required: true },
        category: { type: String, required: true },
        unit: { type: String, default: "piece" },
        stock: { type: Number, default: 0 },
        isOrganic: { type: Boolean, default: false },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
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

export const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;

import { Request, Response } from "express";
import { Product } from "../models/index.js";

// GET /api/products/flash-deals
export const getFlashDeals = async (req: Request, res: Response) => {
    const products = await Product.find({ stock: { $gt: 0 } }).sort({ originalPrice: -1 });

    const productsWithDiscount = products.map((doc: any) => {
        const p = doc.toJSON ? doc.toJSON() : doc;
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return { ...p, discount };
    });

    res.json({ products: productsWithDiscount.slice(0, 8) });
};

// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    const query: any = {};
    if (category && category !== "all") query.category = category as string;
    if (search) query.name = { $regex: search as string, $options: "i" };
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price-low") sortOption = { price: 1 };
    else if (sort === "price-high") sortOption = { price: -1 };

    const products = await Product.find(query).sort(sortOption);

    const productsWithDiscount = products.map((doc: any) => {
        const p = doc.toJSON ? doc.toJSON() : doc;
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
        return { ...p, discount };
    });

    res.json({ products: productsWithDiscount });
};

// GET /api/products/:id
export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id as string);

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        const p = product.toJSON();
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

        res.json({ product: { ...p, discount } });
    } catch (err: any) {
        res.status(404).json({ message: "Product not found" });
    }
};

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
    const product = await Product.create(req.body);
    res.status(201).json({ product: product.toJSON() });
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id as string, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({ product: product.toJSON() });
    } catch (err: any) {
        res.status(404).json({ message: "Product not found" });
    }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await Product.findByIdAndUpdate(req.params.id as string, { stock: 0 });
        res.json({ message: "Product Updated" });
    } catch (err: any) {
        res.status(404).json({ message: "Product not found" });
    }
};

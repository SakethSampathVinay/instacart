import { Request, Response } from "express";
import { Order, User, Product, DeliveryPartner } from "../models/index.js";
import bcrypt from "bcrypt";

// get admin dashboard data
export const getAdminStats = async (req: Request, res: Response) => {
    const [totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders] = await Promise.all([
        Order.countDocuments({ $nor: [{ paymentMethod: "card", isPaid: false }] }),
        User.countDocuments(),
        Product.countDocuments(),
        Product.countDocuments({ stock: 0 }),
        DeliveryPartner.countDocuments(),
        Order.find({ $nor: [{ paymentMethod: "card", isPaid: false }] })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate({ path: "user", select: "name email" })
            .populate({ path: "deliveryPartner", select: "name phone" }),
    ]);

    res.json({
        totalOrders,
        totalUsers,
        totalProducts,
        outOfStock,
        totalPartners,
        recentOrders: recentOrders.map((o) => o.toJSON()),
    });
};

// get delivery partners list for admin
export const getDeliveryPartners = async (req: Request, res: Response) => {
    const partners = await DeliveryPartner.find().sort({ createdAt: -1 });
    res.json({ partners: partners.map((p) => p.toJSON()) });
};

// create delivery partner profile
export const createDeliveryPartner = async (req: Request, res: Response) => {
    const { name, email, password, phone, vehicleType } = req.body;

    if (!name || !email || !password || !phone) {
        res.status(400).json({ message: "Please provide all required fields" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const partner = await DeliveryPartner.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        vehicleType,
    });

    res.status(201).json({ partner: partner.toJSON() });
};

// update delivery partner profile
export const updateDeliveryPartner = async (req: Request, res: Response) => {
    const { name, phone, vehicleType, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (vehicleType !== undefined) data.vehicleType = vehicleType;
    if (isActive !== undefined) data.isActive = isActive;

    try {
        const partner = await DeliveryPartner.findByIdAndUpdate(req.params.id as string, data, { new: true });
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }
        res.json({ partner: partner.toJSON() });
    } catch (error) {
        res.status(404).json({ message: "Partner not found" });
    }
};

// assign delivery partner for order
export const assignDeliveryPartner = async (req: Request, res: Response) => {
    const { partnerId } = req.body;

    try {
        const order = await Order.findById(req.params.id as string);
        const partner = await DeliveryPartner.findById(partnerId);

        if (!order || !partner) {
            return res.status(404).json({ message: "Order or partner not found" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        let status = order.status;
        const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory : [];

        if (order.status === "Placed" || order.status === "Confirmed") {
            status = "Assigned";
            history.push({
                status: "Assigned",
                note: `Assigned to ${partner.name}`,
                timestamp: new Date(),
            });
        }

        order.deliveryPartnerId = partner._id;
        order.deliveryOtp = otp;
        order.status = status;
        order.statusHistory = history;
        await order.save();

        res.json({ order: order.toJSON() });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

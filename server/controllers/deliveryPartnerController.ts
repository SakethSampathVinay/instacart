import { Request, Response } from "express";
import { DeliveryPartner, Order } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (id: string) => {
    return jwt.sign({ id, role: "delivery" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
};

// Login Delivery Partner
// POST /api/delivery/login
export const loginPartner = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
    }

    const partner = await DeliveryPartner.findOne({
        email: email.toLowerCase(),
    });

    if (!partner) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!partner.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated" });
    }

    const isMatch = await bcrypt.compare(password, partner.password || "");
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(partner.id);
    const partnerData: any = partner.toJSON();
    delete partnerData.password;

    res.json({ partner: partnerData, token });
};

// Get assigned deliveries
// GET /api/delivery/my-deliveries
export const getMyDeliveries = async (req: Request, res: Response) => {
    const { status } = req.query;

    const query: any = { deliveryPartnerId: req.partner!.id };

    if (status === "active") {
        query.status = { $in: ["Assigned", "Packed", "Out for Delivery"] };
    } else if (status === "completed") {
        query.status = { $in: ["Delivered", "Cancelled"] };
    }

    const orders = await Order.find(query)
        .populate({ path: "user", select: "name email phone" })
        .sort({ createdAt: -1 });

    res.json({ orders: orders.map((o) => o.toJSON()) });
};

// Get single delivery detail
// GET /api/delivery/my-deliveries/:id
export const getDeliveryDetail = async (req: Request, res: Response) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id as string,
            deliveryPartnerId: req.partner!.id,
        }).populate({ path: "user", select: "name email phone" });

        if (!order) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        res.json({ order: order.toJSON() });
    } catch (err) {
        return res.status(404).json({ message: "Delivery not found" });
    }
};

// Complete delivery with OTP
// PUT /api/delivery/my-deliveries/:id/complete
export const completeDelivery = async (req: Request, res: Response) => {
    const { otp } = req.body;
    try {
        const order = await Order.findOne({
            _id: req.params.id as string,
            deliveryPartnerId: req.partner!.id,
        });

        if (!order || order.status === "Cancelled" || order.status === "Delivered") {
            return res.status(400).json({ message: "Invalid Request" });
        }

        if (order.deliveryOtp !== otp) {
            return res.status(500).json({ message: "Invalid OTP" });
        }

        const history = (order.statusHistory as any[]) || [];
        history.push({ status: "Delivered", note: "Delivered by partner", timestamp: new Date() });

        order.status = "Delivered";
        order.statusHistory = history;
        order.deliveryOtp = "";
        await order.save();

        res.json({ order: order.toJSON(), message: "Delivery completed successfully" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// Cancel delivery
// PUT /api/delivery/my-deliveries/:id/cancel
export const cancelDelivery = async (req: Request, res: Response) => {
    const { reason } = req.body;
    try {
        const order = await Order.findOne({
            _id: req.params.id as string,
            deliveryPartnerId: req.partner!.id,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "Delivered") {
            return res.status(400).json({ message: "Cannot cancel a delivered order" });
        }

        const history = (order.statusHistory as any[]) || [];
        history.push({ status: "Cancelled", note: reason || "", timestamp: new Date() });

        order.status = "Cancelled";
        order.statusHistory = history;
        await order.save();

        res.json({ order: order.toJSON(), message: "Delivery cancelled" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// Update order status
// PUT /api/delivery/my-deliveries/:id/status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const allowedStatuses = ["Packed", "Out for Delivery"];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status update" });
    }

    try {
        const order = await Order.findOne({
            _id: req.params.id as string,
            deliveryPartnerId: req.partner!.id,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const history = (order.statusHistory as any[]) || [];
        history.push({ status, note: `Status updated to ${status}`, timestamp: new Date() });

        order.status = status;
        order.statusHistory = history;
        await order.save();

        res.json({ order: order.toJSON() });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// Update live location
// PUT /api/delivery/my-deliveries/:id/location
export const updateLocation = async (req: Request, res: Response) => {
    const { lat, lng } = req.body;
    try {
        const order = await Order.findOneAndUpdate(
            {
                _id: req.params.id as string,
                deliveryPartnerId: req.partner!.id,
                status: { $in: ["Assigned", "Packed", "Out for Delivery"] },
            },
            { liveLocation: { lat, lng, updatedAt: new Date() } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found or not in active state" });
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

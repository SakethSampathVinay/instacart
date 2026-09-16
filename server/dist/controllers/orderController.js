import { Order, Product } from "../models/index.js";
import { inngest } from "../inngest/index.js";
import Stripe from "stripe";
// Create order
// POST /api/orders
export const createOrder = async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;
    // Check if order items are empty
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "No order items" });
    }
    // Look up actual prices from the database
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach((p) => {
        const prod = p.toJSON ? p.toJSON() : p;
        productMap[prod.id] = prod;
    });
    // Check if product is in stock
    for (const item of items) {
        const product = productMap[item.product];
        if (!product || (product.stock ?? 0) < item.quantity) {
            return res.status(404).json({ message: "Product out of stock" });
        }
    }
    const orderItems = items.map((item) => {
        const dbProduct = productMap[item.product];
        if (!dbProduct)
            throw new Error(`Product ${item.product} not found`);
        return {
            product: dbProduct.id,
            name: dbProduct.name,
            image: dbProduct.image,
            price: dbProduct.price,
            quantity: item.quantity,
            unit: dbProduct.unit,
        };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 20 ? 0 : 1.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;
    const order = await Order.create({
        userId: req.user.id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        deliveryFee,
        tax,
        total,
        statusHistory: [{ status: "Placed", note: "Order placed successfully", timestamp: new Date() }],
    });
    if (paymentMethod === "card") {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        // create session
        const session = await stripe.checkout.sessions.create({
            success_url: `${req.headers.origin}/orders?clearCart=true`,
            cancel_url: `${req.headers.origin}/checkout`,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Payment Groceries",
                        },
                        unit_amount: Math.round(total * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            metadata: { orderId: order.id },
        });
        return res.json({ url: session.url });
    }
    res.json({ order: order.toJSON() });
    // Decrease stock
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
        });
    }
    // Send stock update events for each product in the order
    for (const item of orderItems) {
        await inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } });
    }
    await inngest.send({ name: "order/placed", data: { orderId: order.id } });
};
// Get user's orders
// GET /api/orders
export const getUserOrders = async (req, res) => {
    const { status } = req.query;
    const query = {
        userId: req.user.id,
        $nor: [{ paymentMethod: "card", isPaid: false }],
    };
    if (status && status !== "all") {
        query.status = status;
    }
    const orders = await Order.find(query)
        .populate({ path: "deliveryPartner", select: "name phone" })
        .sort({ createdAt: -1 });
    res.json({ orders: orders.map((o) => o.toJSON()) });
};
// Get single order
// GET /api/orders/:id
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.user.id,
        }).populate({ path: "deliveryPartner", select: "name phone avatar vehicleType" });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ order: order.toJSON() });
    }
    catch (err) {
        return res.status(404).json({ message: "Order not found" });
    }
};
// Update order status (admin)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    const { status, note } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []);
        history.push({ status, note: note || `Order ${status.toLowerCase()}`, timestamp: new Date() });
        order.status = status;
        order.statusHistory = history;
        await order.save();
        res.json({ order: order.toJSON() });
    }
    catch (err) {
        return res.status(404).json({ message: "Order not found" });
    }
};
// Get all orders (admin)
// GET /api/orders/all
export const getAllOrders = async (req, res) => {
    const orders = await Order.find({
        $nor: [{ paymentMethod: "card", isPaid: false }],
    })
        .populate({ path: "user", select: "name email" })
        .populate({ path: "deliveryPartner", select: "name phone email" })
        .sort({ createdAt: -1 });
    res.json({ orders: orders.map((o) => o.toJSON()) });
};
// Get Order Location
// GET /api/orders/:id/location
export const getOrderLocation = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.user.id,
        }).select("liveLocation status");
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        res.json({ liveLocation: order.liveLocation, status: order.status });
    }
    catch (err) {
        return res.status(404).json({ message: "Order not found" });
    }
};

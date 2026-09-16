import { Address } from "../models/index.js";
// Get user addresses
// GET /api/addresses
export const getAddresses = async (req, res) => {
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json({ addresses: addresses.map((a) => a.toJSON()) });
};
// Add address
// POST /api/addresses
export const addAddress = async (req, res) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;
    // Require coordinates
    if (lat == null || lng == null) {
        return res.status(400).json({ message: "Location coordinates are required. Please allow location access." });
    }
    const currentAddresses = await Address.find({ userId: req.user.id });
    let makeDefault = isDefault;
    if (currentAddresses.length === 0)
        makeDefault = true;
    if (makeDefault) {
        await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    await Address.create({
        userId: req.user.id,
        label,
        address,
        city,
        state,
        zip,
        isDefault: makeDefault,
        lat: Number(lat),
        lng: Number(lng),
    });
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.status(201).json({ addresses: addresses.map((a) => a.toJSON()) });
};
// Update address
// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;
    // Require coordinates
    if (lat == null || lng == null) {
        return res.status(400).json({ message: "Location coordinates are required. Please allow location access." });
    }
    if (isDefault) {
        await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }
    const data = {};
    if (label)
        data.label = label;
    if (address)
        data.address = address;
    if (city)
        data.city = city;
    if (state)
        data.state = state;
    if (zip)
        data.zip = zip;
    if (isDefault !== undefined)
        data.isDefault = isDefault;
    if (lat != null)
        data.lat = Number(lat);
    if (lng != null)
        data.lng = Number(lng);
    try {
        const updated = await Address.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!updated) {
            return res.status(404).json({ message: "Address not found" });
        }
    }
    catch (err) {
        return res.status(404).json({ message: "Address not found" });
    }
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json({ addresses: addresses.map((a) => a.toJSON()) });
};
// Delete address
// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
    try {
        await Address.findByIdAndDelete(req.params.id);
    }
    catch (err) {
        console.log(err.message);
    }
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json({ addresses: addresses.map((a) => a.toJSON()) });
};

import jwt from 'jsonwebtoken';
import User from "../models/User.js";


// middleware to authenticate user using JWT
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Authentication failed: missing token' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userID }).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};
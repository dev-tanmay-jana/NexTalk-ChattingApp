import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup controller
export const singup = async (req,res)=>{
    const {fullName , email, password, bio} = req.body;

    try {
        if(!fullName || !email || !password || !bio){
            return res.status(400).json({success: false, message:"All fields are required"});
        }
        // Check if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(409).json({success: false, message:"User already exists"});
        }
        // encript password
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);

        //create new user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedpassword,
            bio,
        });

        //authenticate user
        const token = generateToken(newUser._id);
        res.json({success: true, data:{ user: newUser, token, message: "Account Created Successfully" }});
        
    } catch (error) {
        res.json({success: false, message: error.message});
    }
};

// Login controller
export const login = async (req,res)=>{
    const { email, password} = req.body;
    try {
        if(!email || !password){
            return res.status(400).json({success: false, message:"All fields are required"});
        }
        // Check if user exists
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(404).json({success: false, message:"User does not exist"});
        }
        // compare password
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if(!isMatch){
            return res.status(401).json({success: false, message:"Invalid credentials"});
        }
        const token = generateToken(existingUser._id);
        res.json({success: true, data:{ user: existingUser, token, message: "Login Successful" }});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
};

//controler to check authenticated user
export const getAuthenticatedUser = async (req,res)=>{
    res.json({success: true, data: req.user});
};

//controler to update profile datails
export const updateProfile = async (req,res)=>{
    try {
        const { profilePic,fullName, bio } = req.body;
        const userId = req.user._id;

        let updatedData;

        if(!profilePic){
           updatedData = await User.findByIdAndUpdate(userId, { fullName, bio },{ new: true });
        }
        else{
            const upload = await cloudinary.uploader.upload(profilePic, { folder: "NexTalk/Profiles" });
            updatedData = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, fullName, bio },{ new: true });
        }
        res.json({success: true, data: updatedData, message: "Profile updated successfully"});

    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message});
    }
};
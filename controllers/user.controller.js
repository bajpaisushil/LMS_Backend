// const { default: AppError } = require("../utils/appError");
import AppError from "../utils/appError.js";
import User from "../models/user.model.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';

const cookieOptions={
    secure: true,
    maxAge: 7*24*60*60*1000,
    httpOnly: true
}
export const register=async (req, res, next)=>{
    const {fullName, email, password}=req.body;
    if(!fullName || !email || !password){
        return next(new AppError('All fields are required', 400));
    }
    const userExists=await User.findOne({email})
    if(userExists){
        return next(new AppError('Email already exists', 400));
    }
    const user=await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: 'https://img.freepik.com/premium-vector/young-smiling-man-avatar-man-with-brown-beard-mustache-hair-wearing-yellow-sweater-sweatshirt-3d-vector-people-character-illustration-cartoon-minimal-style_365941-860.jpg'
        }
    })

    if(!user){
        return next(new AppError('User Registration failed! Please try again', 400))
    }
    console.log(user);
    //Upload user picture
    console.log('File details => ', JSON.stringify(req.file));
    if(req.file){
        try {
            const result=await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill'
            })
            if(result){
                user.avatar.public_id=result.public_id;
                user.avatar.secure_url=result.secure_url;
                //remove from local server
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(new AppError(e.message || `File not uploaded, Please try again`, 500));
        }
    }
    await user.save();
    //get JWT token in cookie
    const token=await user.generateJWTToken();
    user.password=undefined;
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        message: 'User registered successfully',
        user
    })
}

export const login=async (req, res)=>{
    const {email, password}=req.body;
    if(!email || !password){
        return next(new AppError('All fields are required', 400));
    }
    const user=await User.findOne({email}).select('+password');
    if(!user || !user.comparePassword(password)){
        return next(new AppError("Email or Password do not match", 400))
    }
    const token=await user.generateJWTToken();
    user.password=undefined;
    res.cookie('token', token, cookieOptions);
    res.status(201).json({
        success: true,
        message: 'User Logged in successfully',
        user
    })
}

export const logout=(req, res)=>{
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })
}

export const getProfile=(req, res)=>{
    const user=User.findById(req.user.id);
    res.status(200).json({
        success: true,
        message: 'User details',
        user
    })
}

export const forgotPassword=async (req, res, next)=>{
    const {email}=req.body;
    if(!email){
        return next(
            new AppError('Email is required', 400)
        )
    }
    const user=await User.findOne({email});
    if(!user){
        return next(
            new AppError('Email is required', 400)
        )
    }
    const resetToken=await user.generateJWTToken();
    await user.save();

    const resetPasswordUrl=`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject=`Reset Password`;
    const message=`You can reset your password by clicking here <a href=${resetPasswordUrl} target="_blank">Reset Your Password</a>. If the above link doesn't work for some reason, Kindly Click on the direct link: ${resetPasswordUrl}`;
    const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: subject,
        html: message
      };
    try {
        await sendEmail(req, res, emailData);
        res.status(200).json({
            success: true,
            message: `Reset Password Link has been sent to ${email} successfully!`
        })
    } catch (e) {
        user.forgotPasswordExpiry=undefined;
        user.forgotPasswordToken=undefined;
        await user.save();
        return next(new AppError(e.message, 500))
    }
}

export const resetPassword=async (req, res)=>{
    const {resetPassword}=req.params;
    const {password}=req.body;
    const forgotPasswordToken=crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
    const user=await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    })
    if(!user){
        return next(new AppError('Token is invalid or expired, Please try again', 400));
    }
    user.password=password;
    user.forgotPasswordExpiry=undefined;
    user.forgotPasswordToken=undefined;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    })
}

export const changePassword=async(req, res, next)=>{
    const {oldPassword, newPassword}=req.body;
    const {id}=req.user;
    if(!oldPassword || !newPassword){
        return next(
            AppError('All fields are mandatory', 400)
        )
    }
    const user=await User.findById(id).select('+password');
    if(!user){
        return next(
            new AppError('User does not exist', 400)
        )
    }
    const isPasswordValid=await user.comparePassword(password);
    if(!isPasswordValid){
        return next(
            new AppError('Invalid old Password', 400)
        )
    }
    user.password=newPassword;
    await user.save();
    user.password=undefined;
    res.status(200).json({
        success: true,
        message: 'Password changed successfully!'
    })
}

export const updateUser=async(req, res, next)=>{
    const {fullName}=req.body;
    const {id}=req.user;
    const user=await User.findById(id);
    if(!user){
        return next(
            new AppError('User does not exist', 400)
        )
    }
    if(fullName){
        user.fullName=fullName;
    }
    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        const result=await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms',
            width: 250,
            height: 250,
            gravity: 'faces',
            crop: 'fill'
        })
        if(result){
            user.avatar.public_id=result.public_id;
            user.avatar.secure_url=result.secure_url;
            //remove from local server
            fs.rm(`uploads/${req.file.filename}`);
        }
    }
    await user.save();
    res.status(200).json({
        success: true,
        message: 'User details updated successfully'
    })
}

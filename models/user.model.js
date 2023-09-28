import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema=mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full Name is required'],
        minLength: [5, 'Name must be atleast 5 Characters'],
        maxLength: [50, 'Name should be less than 50 characters'],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email is already registered'],
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be atleast 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    subscription: {
        id: String,
        status: String
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date
}, {
    timestamps: true
});
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password=await bcrypt.hash(this.password, 10);
})
userSchema.methods={
    comparePassword: function(plainTextPassword){
        return bcrypt.compare(plainTextPassword, this.password);
    },
    generateJWTToken: function(){
        return jwt.sign(
            {userId: this._id, role: this.role, email: this.email, subscription: this.subscription},
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        )
    },
    generatePasswordToken: async function(){
        const resetToken=crypto.randomBytes(20).toString('hex');
        this.forgotPasswordExpiry=Date.now()+15*60*1000;
        this.forgotPasswordToken=crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        return resetToken;
    }
}

const User=mongoose.model("User", userSchema);

export default User;


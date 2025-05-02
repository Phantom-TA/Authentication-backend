import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
const registerUser = async ( req,res) => {
    
   const { name, email, password } = req.body;
   if(!name || !email || !password) {
       return res.status(400).json({ message: "Please fill all fields" });
   }
   console.log(email);

   try{
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
        })
        if(!user){
            return res.status(400).json({ message: "User not registered" });
        }

        const token = crypto.randomBytes(32).toString("hex")
        user.verificationToken = token;
        await user.save();


        //send email

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        const mailOption ={
            from: process.env.MAILTRAP_SENDEREMAIL,
            to: user.email,
            subject: "Verify your email",
            text: `Click on the link to verify your email: 
                   ${process.env.BASE_URL}/api/v1/users/verify/${token}`,
        }

        await transporter.sendMail(mailOption)

        res.status(201).json({ 
            message: "User registered successfully" ,
            success:true
        });

   }catch(err){
      
       return res.status(400).json({ 
        message: "User not registered",
        err,
        success:false 

       });
   }

}

const verifyUser = async (req, res) => {
    const { token } = req.params;
    if(!token) {
        return res.status(400).json({ message: "Invalid token" });
    }
    const user= await User.findOne({ verificationToken: token })
    if(!user) {
        return res.status(400).json({ message: "Invalid token" });
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    res.status(200).json({
        success: true,
        message: "User verified successfully",
      });

}

const login = async (req,res) => {  
    const { email, password } = req.body;   
    if(!email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    try{
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({ message: "Invalid email " });
        }
      const isMatch = await bcrypt.compare(password,user.password)
      if(!isMatch){
        return res.status(400).json({ message: "Invalid email or password " });
      }

      const token = jwt.sign({id:user._id , role: user.role},
                process.env.JWT_SECRET,
                 {
                  expiresIn: "1d"
                 }  
      )
      const cookieOptions={
        httpOnly: true,
        secure:process.env.NODE_ENV === "production",
        maxAge: 24*60*60*1000,
      }
      res.cookie('token',token,cookieOptions)
        res.status(200).json({
            success:true,
            message:"User logged in successfully",  
            token,
            user:{
                id:user._id,
                name:user.name,
               
                role:user.role,

            }
        })
    }catch(err){
        return res.status(400).json({ 
            message: "User not logged in",
            err,
            success:false }
        );
    }

}

const getMe = async (req,res) => {
    try{  
      const user = await User.findById(req.user.id).select("-password")
      if(!user){
        return res.status(400).json({ 
            message: "User not found", 
            success:false
        });
      }

      res.status(200).json({
        success:true,
        message:"User found",
        user
      })
    }
    catch(err){
      console.log("error in get me",err)
    }
}
const logoutUser = async (req,res) => {
    try{  
          res.cookie('token','',{})
          res.status(200).json({
            success:true,
            message:"User logged out successfully",
          })

    }
    catch(err){
        return res.status(400).json({ 
            message: "Cannot logout user",
            err,
            success:false 
         } ) 
    }
}
const forgotPassword = async (req,res) => {
    try{  
          const { email } = req.body;
            if(!email) {
                return res.status(400).json({ message: "Please fill all fields" });
            }
            const user=await User.findOne({email})
            if(!user){
                return res.status(400).json({ message: "User not found" });
            }
            const token = crypto.randomBytes(32).toString("hex")
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            const transporter = nodemailer.createTransport({
                host: process.env.MAILTRAP_HOST,
                port: process.env.MAILTRAP_PORT,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.MAILTRAP_USERNAME,
                    pass: process.env.MAILTRAP_PASSWORD,
                },
            });
    
            const mailOption ={
                from: process.env.MAILTRAP_SENDEREMAIL,
                to: user.email,
                subject: "Reset your password",
                text: `Click on the link to reset your password: 
                       ${process.env.BASE_URL}/api/v1/users/reset/${token}`,
            }
    
            await transporter.sendMail(mailOption)

            res.status(200).json({
                success:true,
                message:"Reset password link sent to your email",
              });

    }
    catch(err){
         
       return res.status(400).json({ 
        message: "Cannot reset password",
        err,
        success:false 
     } )
    }
}
const resetPassword = async (req,res) => {
    try{  
          const { token } = req.params;
          const { password } =req.body;
            if(!token) {
                return res.status(400).json({ message: "Invalid token" });
            }
           try {
           const user= User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } 
            })
            if(!user){ 
                return res.status(400).json({ message: "Invalid token or reset password link expired" });
            }   
            user.password = password;
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
         

           } catch (error) {
             return res.status(400).json({
                message: "Invalid token " 
             });
           }
    }
    catch(err){
      return res.status(400).json({ 
            message :"Cannot reset password",
            err,    
            success:false
    })  }
}
export { registerUser, verifyUser,login,getMe,logoutUser,forgotPassword,resetPassword} 
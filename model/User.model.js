import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },

   role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",    
    },
    isVerified: {              
        type: Boolean,
        default: false,
    },
    verificationToken: {        
        type: String,
        default: null,
    },
    resetPasswordToken: { 
        type: String,
        default: null,
    },
    resetPasswordExpires: { 
        type: Date,
        default: null,
    },
},
{
    timestamps: true,
}
)

userSchema.pre("save", async function (next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})
const User = mongoose.model("User", userSchema);
export default User;
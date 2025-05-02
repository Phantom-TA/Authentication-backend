import mongoose from "mongoose";

import dotenv from "dotenv";    
dotenv.config();

const db=()=>{
mongoose.connect(process.env.MONGODB_URL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log("Error connecting to MongoDB", err);
});

}
export default db;

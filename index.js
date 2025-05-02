
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import db from './utils/db.js'
import userRoutes from './routes/user.routes.js'
import cookieParser from 'cookie-parser'

dotenv.config()
const app = express();

app.use(cors({
    origin:process.env.BASE_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const port = process.env.PORT ;

db();
app.use("/api/v1/users", userRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
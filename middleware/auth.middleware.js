import jwt from "jsonwebtoken";

export const isLoggedIn = async (req, res, next) => {
    try {
        console.log(req.cookies);
        let token = req.cookies?.token
        console.log('Token Found : ',token ? "YES" : "NO");

        if (!token) {
            console.log("No token ");
            return res.status(401).json({
                message: "Authentication failed",
                success: false,
            });
        }

      try {
         const decoded= jwt.verify(token, process.env.JWT_SECRET)
          console.log("Decoded Token : ",decoded);
          req.user = decoded;
          next();
      } catch (error) {
        console.log("Auth middleware failure")
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
      }
      
        
        
    } catch (error) {
        
    }
    
}
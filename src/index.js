import dotenv from 'dotenv';
import express from 'express'
dotenv.config()
import DB_Connection from "./db/index.js";


DB_Connection().then(()=>{


app.on("error",(error)=>{
    console.log("Error at app.on",error)
    throw error
});


app.listen(process.env.PORT||8000,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})
}).catch((error)=>{
    console.log("MongoDB connection failed",error);
});
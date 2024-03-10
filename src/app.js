import express from 'express'
import cors from 'cors';
import CookiesParser from 'cookies-parser';

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN
}))

app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended:true,limit:"16kb"}));

app.use(express.static("public"));

app.use(CookiesParser());



export {app};
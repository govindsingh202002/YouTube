import mongoose from "mongoose";
import {DB_NAME} from '../constants.js';

async function DB_Connection(){
    try{
    const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected",connectionInstance.connection.host);
    }catch(error){
        console.log("ERRR",error);
        process.exit(1);
    }
}

export default DB_Connection;
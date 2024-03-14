import {Router} from 'express';
import { loginUser, registerUser,logoutUser, refreshAccessToken } from '../Controlles/user.controlles.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router()

//router.route("/register").post(registerUser);->


//register
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

//login
router.route("/login").post(loginUser);

//logout
router.route("/logout").post(verifyJWT,logoutUser);

// refresh access token
router.route("/refresh-token").post(refreshAccessToken);

export default router
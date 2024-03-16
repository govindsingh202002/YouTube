import {Router} from 'express';
import { loginUser,
     registerUser,
     logoutUser, 
     refreshAccessToken,
      getCurrentUser,
      updateUserPassword,
       updateAccountDetails,
        updateAvatarFile, 
        updateCoverImageFile,
        getUserChannelProfile,
        getWatchHistory
    } from '../Controlles/user.controlles.js';
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

//update user password
router.route("/update-password").post(verifyJWT,updateUserPassword);

//get current user
router.route("/current-user").get(verifyJWT,getCurrentUser);

//update account getails
router.route("/update-details").patch(verifyJWT,updateAccountDetails);

//update avatar
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatarFile);

//update cover image
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImageFile);

//user channel profile
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

//watch history
router.route("/watch-history").get(verifyJWT,getWatchHistory);

export default router
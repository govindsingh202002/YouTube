import {Router} from 'express';
import { registerUser } from '../Controlles/user.controlles.js';
const router=Router();

router.route("/register").post(registerUser);

export default router;
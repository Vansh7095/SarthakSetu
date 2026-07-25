import { Router, type IRouter } from "express";
import usersRouter from "./users";
import donationsRouter from "./donations";
import claimsRouter from "./claims";
import statsRouter from "./stats";
import verifyRouter from "./verify";
import adminRegistryRouter from "./admin-registry";

const router: IRouter = Router();

router.use(usersRouter);
router.use(donationsRouter);
router.use(claimsRouter);
router.use(statsRouter);
router.use(verifyRouter);
router.use(adminRegistryRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import donationsRouter from "./donations";
import claimsRouter from "./claims";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(donationsRouter);
router.use(claimsRouter);
router.use(statsRouter);

export default router;

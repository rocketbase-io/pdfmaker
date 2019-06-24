import cors from "cors";

export const corsMiddleware = cors({credentials: true, origin: true});
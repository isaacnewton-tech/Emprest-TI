import { z } from "zod";

export const MAX_OPEN_LOANS = 5;
export const equipmentCategory = z.enum(["notebook", "monitor", "cabo", "camera"]);
export const equipmentPatrimonio = z.string().regex(/^TI-\d{4}$/);

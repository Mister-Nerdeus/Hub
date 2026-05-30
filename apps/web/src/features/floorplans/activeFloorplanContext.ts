import { createContext } from "react";
import type { ActiveFloorplanContract } from "@nerdeus/shared";

export const ActiveFloorplanContext = createContext<ActiveFloorplanContract | null>(null);

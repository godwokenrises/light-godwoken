import { createContext } from "react";
import { BaseProvider } from "@metamask/providers";

export const EthereumContext = createContext<BaseProvider | null>(null);
export const AccountContext = createContext<string | null>(null);

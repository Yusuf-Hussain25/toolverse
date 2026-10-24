import { useContext } from "react";
import { AccountContext } from "../context/account";

// { me, usage, plan, tools, isDemo, error, refresh, setUsage } for the signed-in user
export const useAccount = () => useContext(AccountContext);

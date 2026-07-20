import { createContext, useContext } from "react";

export const SocketContext = createContext({ socket: null, status: "disconnected" });

export function useSocket() {
  return useContext(SocketContext);
}

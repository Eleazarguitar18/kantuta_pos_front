import { createContext, ReactNode } from "react";
import { io } from "socket.io-client";


const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000");

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

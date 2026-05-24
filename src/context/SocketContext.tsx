import { createContext, ReactNode } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // URL de tu NestJS

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

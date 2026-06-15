import { createContext, ReactNode } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../components/auth/services/urlBase";


const socket = io(API_BASE_URL);

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

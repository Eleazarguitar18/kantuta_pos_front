import { createContext, ReactNode, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../components/auth/services/urlBase";

const socketUrl = API_BASE_URL.replace(/\/api\/?$/, "");
const socket = io(socketUrl);

export const SocketContext = createContext<Socket>(socket);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

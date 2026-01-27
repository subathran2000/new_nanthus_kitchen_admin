import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// In production, use relative URL to go through nginx proxy
// In development, derive WebSocket URL from API URL
const isProduction = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// For production: use empty string (relative URL) so socket.io uses same origin
// For development: use the base URL without /api
const WS_URL = isProduction 
  ? "" 
  : (import.meta.env.VITE_WS_URL || API_URL.replace(/\/api$/, ""));

interface WebSocketMessage {
  type?: string;
  action: string;
  data: any;
  timestamp: Date;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  // Handle incoming messages and invalidate relevant queries
  const handleMenuUpdate = useCallback(
    (message: WebSocketMessage) => {
      const { type, action } = message;

      // Invalidate relevant queries based on the update type
      switch (type) {
        case "primaryCategory":
          queryClient.invalidateQueries({ queryKey: ["primaryCategories"] });
          break;
        case "category":
          queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
          queryClient.invalidateQueries({ queryKey: ["primaryCategories"] }); // Categories affect counts
          break;
        case "item":
          queryClient.invalidateQueries({ queryKey: ["menuItems"] });
          queryClient.invalidateQueries({ queryKey: ["menuCategories"] }); // Items affect counts
          break;
      }

      // Show toast notification for significant changes (optional)
      if (action === "deleted") {
        toast(`Menu ${type} deleted`, { icon: "🗑️" });
      }
    },
    [queryClient],
  );

  const handleNewsletterUpdate = useCallback(
    (message: WebSocketMessage) => {
      const { type, action } = message;

      switch (type) {
        case "subscriber":
          queryClient.invalidateQueries({
            queryKey: ["newsletterSubscribers"],
          });
          break;
        case "campaign":
          queryClient.invalidateQueries({ queryKey: ["newsletterCampaigns"] });
          if (action === "sent") {
            toast.success("Campaign sent successfully!");
          }
          break;
      }
    },
    [queryClient],
  );

  const handleEventUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
  }, [queryClient]);

  const handleSpecialUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["specials"] });
  }, [queryClient]);

  const handleOpeningHoursUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["openingHours"] });
  }, [queryClient]);

  const handleUserUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }, [queryClient]);

  useEffect(() => {
    // Create socket connection with fallback transport
    // In production, WS_URL is empty so socket.io connects to the same origin (through nginx proxy)
    const socketUrl = WS_URL ? `${WS_URL}/admin` : "/admin";
    
    socketRef.current = io(socketUrl, {
      transports: ["polling", "websocket"], // Start with polling, upgrade to websocket
      withCredentials: true, // Required for CORS with credentials
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
      path: isProduction ? "/socket.io" : undefined, // Use default path through nginx proxy
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      // Silently handle connection errors - will auto-retry
      console.debug("WebSocket connection error (will retry):", error.message);
    });

    // Register event handlers
    socket.on("menu:update", handleMenuUpdate);
    socket.on("newsletter:update", handleNewsletterUpdate);
    socket.on("event:update", handleEventUpdate);
    socket.on("special:update", handleSpecialUpdate);
    socket.on("openingHours:update", handleOpeningHoursUpdate);
    socket.on("user:update", handleUserUpdate);

    // Cleanup on unmount
    return () => {
      socket.off("menu:update", handleMenuUpdate);
      socket.off("newsletter:update", handleNewsletterUpdate);
      socket.off("event:update", handleEventUpdate);
      socket.off("special:update", handleSpecialUpdate);
      socket.off("openingHours:update", handleOpeningHoursUpdate);
      socket.off("user:update", handleUserUpdate);
      socket.disconnect();
    };
  }, [
    handleMenuUpdate,
    handleNewsletterUpdate,
    handleEventUpdate,
    handleSpecialUpdate,
    handleOpeningHoursUpdate,
    handleUserUpdate,
  ]);

  return socketRef.current;
}

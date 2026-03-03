import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PopoverContent, Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Bell,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Trash2,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Load notifications from localStorage or API
    const stored = localStorage.getItem(`notifications_${user?.id}`);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      if (user) {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (user) {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
    toast.success("All notifications cleared");
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (user) {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "job_match":
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case "application_submitted":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "application_shortlisted":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "application_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "job_posted":
        return <Briefcase className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1"
            >
              <Badge className="h-5 w-5 rounded-full p-0 text-[10px] bg-red-500 text-white">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearAll}
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-xs text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`relative p-3 transition-colors hover:bg-accent/30 ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{notification.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                    {!notification.read && (
                      <div className="absolute right-2 top-3 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
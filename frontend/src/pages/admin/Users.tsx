import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Pagination from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminApi } from "@/api/admin.api";
import { getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  Shield,
  Building2,
  User,
  X,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    role: "",
    search: "",
    is_active: "",
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
        ...filters,
      };
      if (filters.is_active === "") delete params.is_active;

      const res = await adminApi.getUsers(params);
      if (res.data) setUsers(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotal(res.meta.total || 0);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.toggleUser(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
      loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setShowDetail(false);
      }
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowDetail(true);
  };

  const exportUsers = () => {
    if (!users || users.length === 0) {
      toast.error("No users to export");
      return;
    }

    const exportData = users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified ? "Yes" : "No",
      is_active: user.is_active ? "Active" : "Inactive",
      profile_completion: user.profile_completion + "%",
      created_at: formatDate(user.created_at),
    }));

    const headers = Object.keys(exportData[0]);
    const csv = [
      headers.join(","),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${users.length} users`);
  };

  const roleIcons: Record<string, any> = {
    candidate: User,
    recruiter: Building2,
    admin: Shield,
  };

  const roleColors: Record<string, string> = {
    candidate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    recruiter: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading users..." />;

  return (
    <DashboardLayout
      title="User Management"
      subtitle={`${total} total users`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportUsers} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <Select
            value={filters.role}
            onValueChange={(v) => {
              setFilters({ ...filters, role: v });
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="candidate">Candidates</SelectItem>
              <SelectItem value="recruiter">Recruiters</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.is_active}
            onValueChange={(v) => {
              setFilters({ ...filters, is_active: v });
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ role: "", search: "", is_active: "" })}
          className="gap-1"
        >
          <Filter className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role] || User;
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[user.role]}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <UserCheck className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <UserX className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_login_at ? formatDate(user.last_login_at) : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={user.is_active ? "text-destructive" : "text-green-600"}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-6"
      />

      {/* User Detail Modal */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">User Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetail(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <Badge variant="outline" className={`mt-1 ${roleColors[selectedUser.role]}`}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="mt-1 text-sm font-medium capitalize">{selectedUser.auth_provider}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="mt-1 text-sm">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="mt-1 text-sm">
                      {selectedUser.last_login_at ? formatDate(selectedUser.last_login_at) : "Never"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Stats</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{selectedUser.profile_completion}%</p>
                      <p className="text-xs text-muted-foreground">Profile</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-500">{selectedUser.applicationCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Applications</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-500">{selectedUser.jobCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Jobs Posted</p>
                    </div>
                  </div>
                </div>

                {selectedUser.recentActivity && selectedUser.recentActivity.length > 0 && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Recent Activity</p>
                    <div className="mt-2 space-y-2">
                      {selectedUser.recentActivity.slice(0, 5).map((activity: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{activity.action.replace(/_/g, " ")}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetail(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant={selectedUser.is_active ? "destructive" : "default"}
                    onClick={() => {
                      handleToggleActive(selectedUser.id, selectedUser.is_active);
                      setShowDetail(false);
                    }}
                  >
                    {selectedUser.is_active ? "Deactivate User" : "Activate User"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
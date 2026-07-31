import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useGetMyProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Trash2,
  Pencil,
  ShieldAlert,
  Users,
  Search,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────────────

type Role = "donor" | "ngo" | "volunteer" | "admin";

interface AdminUser {
  id: number;
  clerkId: string;
  name: string;
  phone: string;
  role: Role;
  address: string | null;
  city: string | null;
  orgName: string | null;
  donorCategory: string | null;
  operatingRadiusKm: number | null;
  createdAt: string;
}

// ── Fetchers ───────────────────────────────────────────────────────────────

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patchUser(
  id: number,
  data: Partial<AdminUser>,
): Promise<AdminUser> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

// ── Role badge ─────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-800",
  donor: "bg-green-100 text-green-800",
  ngo: "bg-blue-100 text-blue-800",
  volunteer: "bg-orange-100 text-orange-800",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}
    >
      {role}
    </span>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────

function EditModal({
  user,
  onClose,
  onSave,
  isSaving,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: Partial<AdminUser>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    role: user.role,
    city: user.city ?? "",
    address: user.address ?? "",
    orgName: user.orgName ?? "",
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit user</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            City
            <Input value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Address
            <Input value={form.address} onChange={(e) => set("address")(e.target.value)} />
          </label>
          {(user.role === "ngo" || user.role === "volunteer") && (
            <label className="flex flex-col gap-1 text-sm">
              Org / Volunteer name
              <Input value={form.orgName} onChange={(e) => set("orgName")(e.target.value)} />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Role
            <Select value={form.role} onValueChange={(v) => set("role")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donor">Donor</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                name: form.name,
                phone: form.phone,
                role: form.role as Role,
                city: form.city || undefined,
                address: form.address || undefined,
                orgName: form.orgName || undefined,
              })
            }
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({
  user,
  onClose,
  onConfirm,
  isDeleting,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-destructive">Delete account?</h2>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <strong>{user.name}</strong>'s account and remove them from Clerk.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { data: myProfile } = useGetMyProfile();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUser> }) =>
      patchUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(null);
      toast({ title: "User updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleting(null);
      toast({ title: "Account deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  // Guard — non-admin shouldn't reach this page, but be safe
  if (myProfile && myProfile.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const filtered = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.role.includes(search.toLowerCase()) ||
      (u.city ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          View, edit, and delete all registered accounts. Admin-only.
        </p>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, city or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {users && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {users.length} users
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading users…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive py-12 justify-center">
          <ShieldAlert className="h-5 w-5" />
          {(error as any).message ?? "Failed to load users"}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No users found.</p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">City</th>
                  <th className="px-4 py-3 text-left font-medium">Org / Category</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.city ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.orgName ?? u.donorCategory ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleting(u)}
                          disabled={u.id === myProfile?.id}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((u) => (
              <div key={u.id} className="rounded-xl border p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.phone}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                  <span>City: {u.city ?? "—"}</span>
                  <span>Org: {u.orgName ?? u.donorCategory ?? "—"}</span>
                  <span className="col-span-2">
                    Joined:{" "}
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(u)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleting(u)}
                    disabled={u.id === myProfile?.id}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => patchMutation.mutate({ id: editing.id, data })}
          isSaving={patchMutation.isPending}
        />
      )}
      {deleting && (
        <DeleteConfirm
          user={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import {
  useListFssaiLicenses,
  useAddFssaiLicense,
  useDeleteFssaiLicense,
  useListDarpanIds,
  useAddDarpanId,
  useDeleteDarpanId,
  useListAdminCodes,
  useAddAdminCode,
  useDeleteAdminCode,
  getListFssaiLicensesQueryKey,
  getListDarpanIdsQueryKey,
  getListAdminCodesQueryKey,
  useGetMyProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            active === t
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function FssaiPanel() {
  const { data, isLoading, refetch } = useListFssaiLicenses();
  const addLicense = useAddFssaiLicense();
  const deleteLicense = useDeleteFssaiLicense();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    licenseNumber: "",
    businessName: "",
    city: "",
    state: "",
    category: "Restaurant",
  });

  const handleAdd = () => {
    if (
      !form.licenseNumber ||
      !form.businessName ||
      !form.city ||
      !form.state
    ) {
      toast({ variant: "destructive", title: "All fields required" });
      return;
    }
    addLicense.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListFssaiLicensesQueryKey() });
          setForm({
            licenseNumber: "",
            businessName: "",
            city: "",
            state: "",
            category: "Restaurant",
          });
          toast({ title: "License added to registry" });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Failed to add — license number may already exist",
          }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteLicense.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListFssaiLicensesQueryKey() });
          toast({ title: "License removed" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add FSSAI License
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              License Number (14-digit)
            </label>
            <Input
              placeholder="e.g. 10014012000086"
              maxLength={14}
              value={form.licenseNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, licenseNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Business Name
            </label>
            <Input
              placeholder="e.g. Sharma Ji Dhaba"
              value={form.businessName}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              City
            </label>
            <Input
              placeholder="e.g. Delhi"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              State
            </label>
            <Input
              placeholder="e.g. Delhi"
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Category
            </label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Hotel">Hotel</SelectItem>
                <SelectItem value="Caterer">Caterer</SelectItem>
                <SelectItem value="Event Organizer">Event Organizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAdd}
              disabled={addLicense.isPending}
              className="w-full"
            >
              {addLicense.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add License
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">
            Registry ({data?.length ?? 0} licenses)
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y">
            {data?.map((license) => (
              <div
                key={license.id}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {license.licenseNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${license.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {license.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {license.businessName} · {license.city}, {license.state} ·{" "}
                    {license.category}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => handleDelete(license.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No licenses in registry
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DarpanPanel() {
  const { data, isLoading, refetch } = useListDarpanIds();
  const addId = useAddDarpanId();
  const deleteId = useDeleteDarpanId();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    darpanId: "",
    orgName: "",
    city: "",
    state: "",
  });

  const handleAdd = () => {
    if (!form.darpanId || !form.orgName || !form.city || !form.state) {
      toast({ variant: "destructive", title: "All fields required" });
      return;
    }
    addId.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListDarpanIdsQueryKey() });
          setForm({ darpanId: "", orgName: "", city: "", state: "" });
          toast({ title: "Darpan ID added to registry" });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Failed to add — Darpan ID may already exist",
          }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteId.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListDarpanIdsQueryKey() });
          toast({ title: "Darpan ID removed" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add Darpan ID
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              NITI Aayog Darpan ID
            </label>
            <Input
              placeholder="e.g. MH/2010/0012345"
              value={form.darpanId}
              onChange={(e) =>
                setForm((f) => ({ ...f, darpanId: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Organization Name
            </label>
            <Input
              placeholder="e.g. Feeding India Foundation"
              value={form.orgName}
              onChange={(e) =>
                setForm((f) => ({ ...f, orgName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              City
            </label>
            <Input
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              State
            </label>
            <Input
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={addId.isPending} className="mt-3">
          {addId.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add Darpan ID
        </Button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">
            Registry ({data?.length ?? 0} entries)
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y">
            {data?.map((entry) => (
              <div
                key={entry.id}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {entry.darpanId}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${entry.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {entry.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entry.orgName} · {entry.city}, {entry.state}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No Darpan IDs in registry
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCodesPanel() {
  const { data, isLoading, refetch } = useListAdminCodes();
  const addCode = useAddAdminCode();
  const deleteCode = useDeleteAdminCode();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({ code: "", label: "" });

  const handleAdd = () => {
    if (!form.code || !form.label) {
      toast({ variant: "destructive", title: "Code and label required" });
      return;
    }
    addCode.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAdminCodesQueryKey() });
          setForm({ code: "", label: "" });
          toast({ title: "Admin code added" });
        },
        onError: () =>
          toast({
            variant: "destructive",
            title: "Failed — code may already exist",
          }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteCode.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAdminCodesQueryKey() });
          toast({ title: "Code removed" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Admin codes grant full platform access. Share only with trusted
          personnel and rotate codes regularly.
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Issue New Code
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Access Code
            </label>
            <Input
              placeholder="e.g. ANNSETU_ADMIN_2025"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Label / Purpose
            </label>
            <Input
              placeholder="e.g. Operations Team Jan 2025"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          disabled={addCode.isPending}
          className="mt-3"
        >
          {addCode.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Issue Code
        </Button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Active Codes ({data?.length ?? 0})</h3>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y">
            {data?.map((code) => (
              <div
                key={code.id}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {code.code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${code.isActive ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"}`}
                    >
                      {code.isActive ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{code.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => handleDelete(code.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No active codes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRegistry() {
  const [activeTab, setActiveTab] = useState("FSSAI Licenses");
  const { data: profile, isLoading } = useGetMyProfile();
  const [, setLocation] = useLocation();

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <ShieldCheck className="w-12 h-12 text-muted-foreground opacity-50" />
        <p className="text-lg font-medium text-foreground">
          Admin Access Required
        </p>
        <p className="text-muted-foreground text-sm">
          This page is only accessible to platform administrators.
        </p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          <h1 className="text-3xl font-serif font-bold">
            Verification Registry
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage the database of valid FSSAI licenses, NGO Darpan IDs, and admin
          access codes used during onboarding verification.
        </p>
      </div>

      <Tabs
        tabs={["FSSAI Licenses", "Darpan IDs", "Admin Codes"]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "FSSAI Licenses" && <FssaiPanel />}
      {activeTab === "Darpan IDs" && <DarpanPanel />}
      {activeTab === "Admin Codes" && <AdminCodesPanel />}
    </div>
  );
}

import {
  useGetMyProfile,
  useUpsertMyProfile,
  getGetMyProfileQueryKey,
  useSwitchActiveRole,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Plus } from "lucide-react";

type Role = "donor" | "ngo" | "volunteer" | "admin";

const roleLabels: Record<Role, string> = {
  donor: "Food Donor",
  ngo: "NGO / Food Bank",
  volunteer: "Volunteer",
  admin: "Platform Admin",
};

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  city: z.string().optional(),
  address: z.string().optional(),
});

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetMyProfile();
  const upsertProfile = useUpsertMyProfile();
  const switchRole = useSwitchActiveRole();
  const roles = profile?.roles?.length ? profile.roles : profile ? [profile.role] : [];

  const handleRoleSwitch = (role: Role) => {
    switchRole.mutate(
      { data: { role } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMyProfileQueryKey(), data);
          toast({
            title: "Active role changed",
            description: `You are now using SarthakSetu as a ${roleLabels[role]}.`,
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Could not change role",
            description: "Please try again.",
          });
        },
      },
    );
  };

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      address: "",
    },
    values: profile
      ? {
          name: profile.name,
          phone: profile.phone,
          city: profile.city || "",
          address: profile.address || "",
        }
      : undefined,
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!profile) return;

    // We must pass the role along with update
    const payload = {
      ...values,
      role: profile.role,
      donorCategory: profile.donorCategory || undefined,
      orgName: profile.orgName || undefined,
    };

    upsertProfile.mutate(
      { data: payload as any },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMyProfileQueryKey(), data);
          toast({
            title: "Profile updated",
            description: "Your changes have been saved.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update profile.",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          Edit Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-xl mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Active Role
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {roleLabels[profile.role as Role]}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-1 font-medium">
                  {roles.length} role{roles.length === 1 ? "" : "s"} on this account
                </span>
              </div>
              {roles.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {roles.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={profile.role === role ? "default" : "outline"}
                      disabled={profile.role === role || switchRole.isPending}
                      onClick={() => handleRoleSwitch(role as Role)}
                    >
                      {profile.role === role && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {roleLabels[role as Role]}
                    </Button>
                  ))}
                </div>
              )}
              <Link href="/add-role">
                <Button type="button" variant="link" className="px-0 mt-3">
                  <Plus className="w-4 h-4" /> Add another role
                </Button>
              </Link>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={upsertProfile.isPending}
            >
              {upsertProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

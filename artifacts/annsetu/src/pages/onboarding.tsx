import { useState } from "react";
import { useGetMyProfile, useUpsertMyProfile, getGetMyProfileQueryKey, useVerifyFssai, useVerifyDarpan, useVerifyAdminCode } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, ChevronRight, ChevronLeft, Store, HeartHandshake, Bike, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type Role = "donor" | "ngo" | "volunteer" | "admin";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional(),
});

const donorSchema = baseSchema.extend({
  donorCategory: z.enum(["restaurant", "hotel", "caterer", "event_org", "household"], {
    required_error: "Select your donor type",
  }),
  licenseNumber: z.string().optional(),
});

const ngoSchema = baseSchema.extend({
  orgName: z.string().min(2, "Organization name is required"),
  registrationNumber: z.string().min(4, "NGO Registration Number is required"),
  darpanId: z.string().min(4, "NITI Aayog Darpan ID is required"),
  operatingRadiusKm: z.coerce.number().min(1, "Enter operating radius").max(500),
});

const volunteerSchema = baseSchema.extend({
  vehicleType: z.enum(["bike", "auto", "car", "truck", "on_foot"], {
    required_error: "Select vehicle type",
  }),
  availabilityStatus: z.enum(["available", "busy", "part_time"], {
    required_error: "Select availability",
  }),
});

const adminSchema = baseSchema.extend({
  adminCode: z.string().min(1, "Admin access code is required"),
});

const roleCards = [
  {
    role: "donor" as Role,
    icon: Store,
    title: "Food Donor",
    subtitle: "Restaurants, Hotels, Caterers, Households",
    description: "Share surplus food and reduce waste",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    iconColor: "text-orange-500",
    badge: "FSSAI verified for businesses",
  },
  {
    role: "ngo" as Role,
    icon: HeartHandshake,
    title: "NGO / Food Bank",
    subtitle: "Registered organizations",
    description: "Claim food donations and serve communities",
    color: "bg-green-50 border-green-200 hover:border-green-400",
    iconColor: "text-green-600",
    badge: "Registration & Darpan ID required",
  },
  {
    role: "volunteer" as Role,
    icon: Bike,
    title: "Volunteer",
    subtitle: "Individuals",
    description: "Help transport food to those in need",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    badge: "Open to all",
  },
  {
    role: "admin" as Role,
    icon: ShieldCheck,
    title: "Platform Admin",
    subtitle: "Authorized personnel only",
    description: "Manage and oversee the platform",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    iconColor: "text-purple-600",
    badge: "Access code required",
  },
];

type VerifyState = "idle" | "checking" | "valid" | "invalid";

function VerifyBadge({ state, validMsg }: { state: VerifyState; validMsg: string }) {
  if (state === "idle") return null;
  if (state === "checking") return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking database…
    </div>
  );
  if (state === "valid") return (
    <div className="flex items-center gap-1.5 text-green-700 text-sm mt-1">
      <CheckCircle2 className="w-3.5 h-3.5" /> {validMsg}
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-destructive text-sm mt-1">
      <XCircle className="w-3.5 h-3.5" /> Not found in registry. Contact support if this is an error.
    </div>
  );
}

function DonorForm({ onBack, onSubmit, isPending }: { onBack: () => void; onSubmit: (v: any) => void; isPending: boolean }) {
  const form = useForm<z.infer<typeof donorSchema>>({
    resolver: zodResolver(donorSchema),
    defaultValues: { name: "", phone: "", city: "", address: "", licenseNumber: "" },
  });
  const category = form.watch("donorCategory");
  const licenseValue = form.watch("licenseNumber");
  const needsLicense = category && category !== "household";

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifiedBusiness, setVerifiedBusiness] = useState<{ businessName?: string | null; city?: string | null } | null>(null);
  const verifyFssai = useVerifyFssai();

  const handleVerify = async () => {
    if (!licenseValue || licenseValue.trim().length < 14) return;
    setVerifyState("checking");
    verifyFssai.mutate(
      { data: { licenseNumber: licenseValue.trim() } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setVerifyState("valid");
            setVerifiedBusiness(result);
          } else {
            setVerifyState("invalid");
            setVerifiedBusiness(null);
          }
        },
        onError: () => { setVerifyState("invalid"); setVerifiedBusiness(null); },
      }
    );
  };

  const handleSubmit = (values: z.infer<typeof donorSchema>) => {
    if (needsLicense && verifyState !== "valid") {
      form.setError("licenseNumber", { message: "Please verify your FSSAI License Number before continuing" });
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField control={form.control} name="donorCategory" render={({ field }) => (
          <FormItem>
            <FormLabel>Donor Type <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); setVerifyState("idle"); setVerifiedBusiness(null); }} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="What kind of food donor are you?" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                <SelectItem value="hotel">🏨 Hotel / Resort</SelectItem>
                <SelectItem value="caterer">🍱 Caterer</SelectItem>
                <SelectItem value="event_org">🎉 Event Organizer</SelectItem>
                <SelectItem value="household">🏠 Household</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="Full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="10-digit number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>City <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Input placeholder="Street address" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {needsLicense && (
          <FormField control={form.control} name="licenseNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>
                FSSAI License Number <span className="text-destructive">*</span>
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="14-digit number e.g. 10014012000086"
                    maxLength={14}
                    {...field}
                    onChange={(e) => { field.onChange(e); setVerifyState("idle"); setVerifiedBusiness(null); }}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifyState === "checking" || !licenseValue || licenseValue.length < 14}
                  className="flex-shrink-0"
                >
                  {verifyState === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
              <VerifyBadge
                state={verifyState}
                validMsg={verifiedBusiness?.businessName ? `✓ ${verifiedBusiness.businessName}, ${verifiedBusiness.city}` : "License verified"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required under Food Safety and Standards Authority of India (FSSAI).
              </p>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {category === "household" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
            ✅ Households are exempt from FSSAI licensing — no documentation required.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

function NgoForm({ onBack, onSubmit, isPending }: { onBack: () => void; onSubmit: (v: any) => void; isPending: boolean }) {
  const form = useForm<z.infer<typeof ngoSchema>>({
    resolver: zodResolver(ngoSchema),
    defaultValues: { name: "", phone: "", city: "", orgName: "", registrationNumber: "", darpanId: "", operatingRadiusKm: 10 },
  });
  const darpanValue = form.watch("darpanId");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifiedOrg, setVerifiedOrg] = useState<{ orgName?: string | null; city?: string | null } | null>(null);
  const verifyDarpan = useVerifyDarpan();

  const handleVerify = () => {
    if (!darpanValue || darpanValue.trim().length < 4) return;
    setVerifyState("checking");
    verifyDarpan.mutate(
      { data: { darpanId: darpanValue.trim() } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setVerifyState("valid");
            setVerifiedOrg(result);
          } else {
            setVerifyState("invalid");
            setVerifiedOrg(null);
          }
        },
        onError: () => { setVerifyState("invalid"); setVerifiedOrg(null); },
      }
    );
  };

  const handleSubmit = (values: z.infer<typeof ngoSchema>) => {
    if (verifyState !== "valid") {
      form.setError("darpanId", { message: "Please verify your Darpan ID before continuing" });
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField control={form.control} name="orgName" render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Name <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. Feeding India Foundation" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="Full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="10-digit number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="registrationNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>NGO Registration No. <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="e.g. MH/2010/0012345" {...field} /></FormControl>
              <p className="text-xs text-muted-foreground mt-1">State-issued registration number</p>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>City <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="e.g. Delhi" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="darpanId" render={({ field }) => (
          <FormItem>
            <FormLabel>NITI Aayog Darpan ID <span className="text-destructive">*</span></FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  placeholder="e.g. MH/2010/0012345"
                  {...field}
                  onChange={(e) => { field.onChange(e); setVerifyState("idle"); setVerifiedOrg(null); }}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                disabled={verifyState === "checking" || !darpanValue || darpanValue.length < 4}
                className="flex-shrink-0"
              >
                {verifyState === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
            <VerifyBadge
              state={verifyState}
              validMsg={verifiedOrg?.orgName ? `✓ ${verifiedOrg.orgName}, ${verifiedOrg.city}` : "Darpan ID verified"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              From <a href="https://ngodarpan.gov.in" target="_blank" rel="noreferrer" className="underline">ngodarpan.gov.in</a>
            </p>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="operatingRadiusKm" render={({ field }) => (
          <FormItem>
            <FormLabel>Operating Radius (km) <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input type="number" min={1} max={500} placeholder="e.g. 20" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Your Darpan ID is verified against NITI Aayog records in our database. Ensure it matches your registration exactly.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

function VolunteerForm({ onBack, onSubmit, isPending }: { onBack: () => void; onSubmit: (v: any) => void; isPending: boolean }) {
  const form = useForm<z.infer<typeof volunteerSchema>>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: { name: "", phone: "", city: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="Your name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="10-digit number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="city" render={({ field }) => (
          <FormItem>
            <FormLabel>City <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. Bengaluru" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="vehicleType" render={({ field }) => (
            <FormItem>
              <FormLabel>Your Vehicle <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="on_foot">🚶 On Foot</SelectItem>
                  <SelectItem value="bike">🛵 Bike / Scooter</SelectItem>
                  <SelectItem value="auto">🛺 Auto Rickshaw</SelectItem>
                  <SelectItem value="car">🚗 Car</SelectItem>
                  <SelectItem value="truck">🚛 Truck / Van</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="availabilityStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Availability <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="available">✅ Full time</SelectItem>
                  <SelectItem value="part_time">🕐 Part time / weekends</SelectItem>
                  <SelectItem value="busy">⏸️ Currently busy</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

function AdminForm({ onBack, onSubmit, isPending }: { onBack: () => void; onSubmit: (v: any) => void; isPending: boolean }) {
  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: "", phone: "", city: "", adminCode: "" },
  });
  const codeValue = form.watch("adminCode");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const verifyAdminCode = useVerifyAdminCode();
  const { toast } = useToast();

  const handleVerify = () => {
    if (!codeValue || codeValue.trim().length < 1) return;
    setVerifyState("checking");
    verifyAdminCode.mutate(
      { data: { code: codeValue.trim() } },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setVerifyState("valid");
          } else {
            setVerifyState("invalid");
            toast({ variant: "destructive", title: "Invalid code", description: "This access code is not in the registry or has been deactivated." });
          }
        },
        onError: () => { setVerifyState("invalid"); },
      }
    );
  };

  const handleSubmit = (values: z.infer<typeof adminSchema>) => {
    if (verifyState !== "valid") {
      form.setError("adminCode", { message: "Please verify your admin access code first" });
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-800 font-medium">🔐 Admin Access</p>
          <p className="text-xs text-purple-700 mt-1">Admin accounts require a valid access code from the SarthakSetu operations team. Codes are stored and verified against our secure database.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="Your name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="10-digit number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="city" render={({ field }) => (
          <FormItem>
            <FormLabel>City <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. New Delhi" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="adminCode" render={({ field }) => (
          <FormItem>
            <FormLabel>Admin Access Code <span className="text-destructive">*</span></FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter access code"
                  {...field}
                  onChange={(e) => { field.onChange(e); setVerifyState("idle"); }}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                disabled={verifyState === "checking" || !codeValue}
                className="flex-shrink-0"
              >
                {verifyState === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
            <VerifyBadge state={verifyState} validMsg="Access code verified — admin access granted" />
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending || verifyState !== "valid"}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Setup <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: profile, isLoading } = useGetMyProfile();
  const upsertProfile = useUpsertMyProfile();

  useEffect(() => {
    if (profile) setLocation("/dashboard");
  }, [profile, setLocation]);

  const handleSubmit = (values: any) => {
    const { adminCode: _adminCode, ...rest } = values;
    const payload = { ...rest, role: selectedRole! };

    upsertProfile.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetMyProfileQueryKey(), data);
          toast({ title: "Welcome to SarthakSetu!", description: "Your profile is set up and ready." });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to create profile. Please try again." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          Step {step === "role" ? "1" : "2"} of 2
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          {step === "role" ? "How will you use SarthakSetu?" : `Setting up your ${selectedRole === "ngo" ? "NGO" : selectedRole} profile`}
        </h1>
        <p className="text-muted-foreground">
          {step === "role"
            ? "Choose your role — you can update this later from your profile"
            : "We verify your details against our database before activating your account"}
        </p>
      </div>

      {step === "role" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.role}
                type="button"
                onClick={() => { setSelectedRole(card.role); setStep("details"); }}
                className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${card.color} group`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${card.iconColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-base">{card.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{card.subtitle}</p>
                    <p className="text-foreground/70 text-sm mt-2">{card.description}</p>
                    <span className="inline-block mt-3 text-xs bg-white/80 border border-border rounded-full px-2 py-0.5 font-medium text-muted-foreground">
                      {card.badge}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground mt-1 flex-shrink-0 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          {selectedRole && (
            <div className="flex items-center gap-2 mb-6 pb-5 border-b border-border">
              {roleCards.filter(c => c.role === selectedRole).map(card => {
                const Icon = card.icon;
                return (
                  <span key={card.role} className={`flex items-center gap-2 text-sm font-medium ${card.iconColor}`}>
                    <Icon className="w-4 h-4" /> {card.title}
                  </span>
                );
              })}
            </div>
          )}

          {selectedRole === "donor" && (
            <DonorForm onBack={() => setStep("role")} onSubmit={handleSubmit} isPending={upsertProfile.isPending} />
          )}
          {selectedRole === "ngo" && (
            <NgoForm onBack={() => setStep("role")} onSubmit={handleSubmit} isPending={upsertProfile.isPending} />
          )}
          {selectedRole === "volunteer" && (
            <VolunteerForm onBack={() => setStep("role")} onSubmit={handleSubmit} isPending={upsertProfile.isPending} />
          )}
          {selectedRole === "admin" && (
            <AdminForm onBack={() => setStep("role")} onSubmit={handleSubmit} isPending={upsertProfile.isPending} />
          )}
        </div>
      )}
    </div>
  );
}

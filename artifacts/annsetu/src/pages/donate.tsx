import { useCreateDonation, getGetMyDonationsQueryKey, getGetDonorStatsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const donateSchema = z.object({
  foodName: z.string().min(2, "Food name is required"),
  foodType: z.enum(["veg", "non_veg", "both"]),
  quantityPlates: z.coerce.number().min(1, "Must be at least 1 plate"),
  estimatedServings: z.coerce.number().optional(),
  pickupDeadline: z.string().min(1, "Pickup deadline is required"),
  description: z.string().optional(),
  address: z.string().optional(),
});

export default function Donate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createDonation = useCreateDonation();

  const form = useForm<z.infer<typeof donateSchema>>({
    resolver: zodResolver(donateSchema),
    defaultValues: {
      foodName: "",
      foodType: "veg",
      quantityPlates: 10,
      description: "",
      address: "",
      pickupDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 hours from now
    },
  });

  const onSubmit = (values: z.infer<typeof donateSchema>) => {
    // Make sure pickupDeadline is complete ISO
    const payload = {
      ...values,
      pickupDeadline: new Date(values.pickupDeadline).toISOString()
    };

    createDonation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyDonationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDonorStatsQueryKey() });
          toast({
            title: "Donation Listed",
            description: "Your food donation has been successfully listed.",
          });
          setLocation("/my-donations");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create donation. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">List Food for Donation</h1>
        <p className="text-muted-foreground">Provide details about the surplus food available for pickup.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="foodName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Name / Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mixed Veg Curry and Roti" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="veg">Vegetarian</SelectItem>
                        <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityPlates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (Plates)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pickupDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                  <FormLabel>Pickup Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address for pickup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any packaging details or pickup instructions..." 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={createDonation.isPending}>
                {createDonation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List Donation
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

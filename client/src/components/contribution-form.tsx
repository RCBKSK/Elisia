import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const contributionSchema = z.object({
  kingdomId: z.string().min(1, "Kingdom is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  period: z.enum(["weekly", "biweekly", "monthly"]),
  description: z.string().optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionFormProps {
  kingdomId?: string;
}

export default function ContributionForm({ kingdomId }: ContributionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      kingdomId: kingdomId || "",
      amount: "",
      period: "weekly",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ContributionFormData) => 
      apiRequest("POST", "/api/contributions", {
        ...data,
        amount: parseFloat(data.amount),
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Contribution added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kingdoms"] });
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to add contribution", variant: "destructive" });
    },
  });

  const onSubmit = (data: ContributionFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Contribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!kingdomId && (
              <FormField
                control={form.control}
                name="kingdomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kingdom</FormLabel>
                    <FormControl>
                      <Input placeholder="Kingdom ID" {...field} data-testid="input-contribution-kingdom" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      {...field} 
                      data-testid="input-contribution-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contribution-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes about this contribution..." 
                      {...field} 
                      data-testid="textarea-contribution-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={createMutation.isPending}
              data-testid="button-submit-contribution"
            >
              {createMutation.isPending ? "Adding..." : "Add Contribution"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

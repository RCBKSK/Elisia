import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const paymentRequestSchema = z.object({
  kingdomId: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  walletAddress: z.string().min(1, "Wallet address is required"),
  description: z.string().optional(),
});

type PaymentRequestFormData = z.infer<typeof paymentRequestSchema>;

export default function PaymentRequestForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: kingdoms = [] } = useQuery({
    queryKey: ["/api/kingdoms"],
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const { data: payoutData } = useQuery({
    queryKey: ["/api/user/payout-summary"],
  });

  // Calculate available unpaid amount
  const unpaidAmount = payoutData?.unpaidAmount || 0;
  const canSubmitPayment = unpaidAmount > 0;

  const form = useForm<PaymentRequestFormData>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      kingdomId: "",
      amount: unpaidAmount.toFixed(2),
      walletAddress: "",
      description: "",
    },
  });

  // Update amount when unpaid amount changes
  React.useEffect(() => {
    form.setValue("amount", unpaidAmount.toFixed(2));
  }, [unpaidAmount, form]);

  const createMutation = useMutation({
    mutationFn: (data: PaymentRequestFormData) => 
      apiRequest("POST", "/api/payment-requests", {
        ...data,
        amount: parseFloat(data.amount),
        kingdomId: data.kingdomId || null,
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Payment request submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-requests"] });
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
      toast({ title: "Error", description: "Failed to submit payment request", variant: "destructive" });
    },
  });

  const addWalletMutation = useMutation({
    mutationFn: (address: string) => 
      apiRequest("POST", "/api/wallets", { address, isPrimary: wallets.length === 0 }),
    onSuccess: () => {
      toast({ title: "Success", description: "Wallet added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
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
      toast({ title: "Error", description: "Failed to add wallet", variant: "destructive" });
    },
  });

  const onSubmit = (data: PaymentRequestFormData) => {
    createMutation.mutate(data);
  };

  const handleAddWallet = () => {
    const address = prompt("Enter wallet address:");
    if (address) {
      addWalletMutation.mutate(address);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kingdomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kingdom (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-kingdom">
                        <SelectValue placeholder="Select kingdom (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kingdoms.map((kingdom: any) => (
                        <SelectItem key={kingdom.id} value={kingdom.id}>
                          {kingdom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        {...field}
                        readOnly
                        className="bg-muted/50 cursor-not-allowed"
                        data-testid="input-payment-amount"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <i className="fas fa-calculator text-muted-foreground text-xs"></i>
                      </div>
                    </div>
                  </FormControl>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    <i className="fas fa-info-circle"></i>
                    <span>Amount automatically calculated from unpaid contributions</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Address</FormLabel>
                  <div className="flex space-x-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-wallet">
                          <SelectValue placeholder="Select wallet address" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.address}>
                            {wallet.address} {wallet.isPrimary && "(Primary)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddWallet}
                      disabled={addWalletMutation.isPending}
                      data-testid="button-add-wallet"
                    >
                      <i className="fas fa-plus"></i>
                    </Button>
                  </div>
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
                      placeholder="Add any notes about this payment request..." 
                      {...field} 
                      data-testid="textarea-payment-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!canSubmitPayment ? (
              <div className="w-full p-4 bg-muted/30 rounded-lg border border-dashed border-muted">
                <div className="text-center">
                  <i className="fas fa-info-circle text-muted-foreground text-lg mb-2"></i>
                  <p className="text-sm text-muted-foreground mb-1">No unpaid contributions available</p>
                  <p className="text-xs text-muted-foreground">
                    Complete more kingdom development tasks to earn payment requests
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending || !canSubmitPayment}
                data-testid="button-submit-payment-request"
              >
                {createMutation.isPending ? "Submitting..." : `Request Payment ($${unpaidAmount.toFixed(2)})`}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

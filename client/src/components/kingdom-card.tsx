import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ContributionForm from "./contribution-form";

const kingdomSchema = z.object({
  name: z.string().min(1, "Kingdom name is required"),
  lokKingdomId: z.string().optional(),
  level: z.number().min(1).max(100),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "developing", "inactive"]),
});

type KingdomFormData = z.infer<typeof kingdomSchema>;

interface KingdomCardProps {
  kingdom?: any;
}

export default function KingdomCard({ kingdom }: KingdomCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!kingdom);

  const form = useForm<KingdomFormData>({
    resolver: zodResolver(kingdomSchema),
    defaultValues: {
      name: kingdom?.name || "",
      lokKingdomId: kingdom?.lokKingdomId || "",
      level: kingdom?.level || 1,
      imageUrl: kingdom?.imageUrl || "",
      status: kingdom?.status || "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: KingdomFormData) => apiRequest("POST", "/api/kingdoms", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Kingdom created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kingdoms"] });
      setIsEditing(false);
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
      toast({ title: "Error", description: "Failed to create kingdom", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: KingdomFormData) => apiRequest("PUT", `/api/kingdoms/${kingdom.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Kingdom updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/kingdoms"] });
      setIsEditing(false);
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
      toast({ title: "Error", description: "Failed to update kingdom", variant: "destructive" });
    },
  });

  const onSubmit = (data: KingdomFormData) => {
    if (kingdom) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400";
      case "developing":
        return "bg-yellow-500/20 text-yellow-400";
      case "inactive":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getProgressWidth = (level: number) => {
    return Math.min((level / 25) * 100, 100); // Assuming max level display is 25
  };

  if (isEditing || !kingdom) {
    return (
      <Card className="kingdom-card" data-testid={`card-kingdom-${kingdom?.id || 'new'}`}>
        <CardHeader>
          <CardTitle>{kingdom ? "Edit Kingdom" : "Create New Kingdom"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kingdom Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter kingdom name" {...field} data-testid="input-kingdom-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lokKingdomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LOK Kingdom ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 61936d3b80e0c82c776a9d1a" {...field} data-testid="input-lok-kingdom-id" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Enter your League of Kingdoms game ID to track contributions from the API
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={100} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-kingdom-level"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-kingdom-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-kingdom-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="developing">Developing</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-kingdom"
                >
                  {kingdom ? "Update Kingdom" : "Create Kingdom"}
                </Button>
                {kingdom && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-kingdom-edit"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="kingdom-card" data-testid={`card-kingdom-${kingdom.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {kingdom.imageUrl ? (
              <img 
                src={kingdom.imageUrl} 
                alt={`${kingdom.name} kingdom`} 
                className="w-12 h-12 rounded-lg object-cover"
                data-testid={`img-kingdom-${kingdom.id}`}
              />
            ) : (
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-castle text-primary"></i>
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground" data-testid={`text-kingdom-name-${kingdom.id}`}>
                {kingdom.name}
              </h3>
              <p className="text-sm text-muted-foreground">Level {kingdom.level}</p>
              {kingdom.lokKingdomId && (
                <p className="text-xs text-muted-foreground">LOK ID: {kingdom.lokKingdomId}</p>
              )}
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(kingdom.status)}`}>
            {kingdom.status.charAt(0).toUpperCase() + kingdom.status.slice(1)}
          </span>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground">{getProgressWidth(kingdom.level).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="progress-bar h-2 rounded-full" 
                style={{ width: `${getProgressWidth(kingdom.level)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Contributions:</span>
            <span className="text-foreground font-medium" data-testid={`text-kingdom-total-${kingdom.id}`}>
              ${parseFloat(kingdom.totalContributions || "0").toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <div className="flex-1 p-3 bg-muted/30 rounded-lg border border-dashed border-muted">
            <div className="text-center">
              <i className="fas fa-chart-line text-muted-foreground text-lg mb-1"></i>
              <p className="text-xs text-muted-foreground">
                Contributions auto-sync from League of Kingdoms API
              </p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsEditing(true)}
            data-testid={`button-edit-kingdom-${kingdom.id}`}
          >
            <i className="fas fa-edit"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* eslint-disable react-hooks/incompatible-library */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const baseSchema = z.object({
  role: z.string().min(1, "Role is required"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
});

export function AddUserModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      role: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      address: "",
      // Dynamic fields
      membershipPlan: "monthly",
      employeeId: "",
      department: "",
      assignedZone: "",
      vehicleType: "",
      vehicleNumber: "",
      companyName: "",
      licenseNumber: "",
    }
  });

  const selectedRole = watch("role");

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      
      if (["supervisor", "delivery_agent", "recycler"].includes(selectedRole)) {
        payload.name = payload.fullName;
        payload.phone = payload.phoneNumber;
      }

      let endpoint;
      switch (selectedRole) {
        case "trial_member":
          endpoint = "/admin/users/trial";
          break;
        case "member":
          endpoint = "/admin/users/member";
          break;
        case "supervisor":
          endpoint = "/admin/users/supervisor";
          break;
        case "delivery_agent":
          endpoint = "/admin/users/delivery-agent";
          break;
        case "recycler":
          endpoint = "/admin/users/recycler";
          break;
        default:
          throw new Error("Invalid role selected");
      }
      
      const response = await apiClient.post(endpoint, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create user");
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user and assign a specific role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Role *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("role")}
            >
              <option value="">Select a role</option>
              <option value="trial_member">Trial Member</option>
              <option value="member">Permanent Member</option>
              <option value="supervisor">Supervisor</option>
              <option value="delivery_agent">Delivery Agent</option>
              <option value="recycler">Recycler</option>
            </select>
            {errors.role && <span className="text-sm text-red-500">{errors.role.message}</span>}
          </div>

          {selectedRole && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input {...register("fullName")} placeholder="John Doe" />
                  {errors.fullName && <span className="text-sm text-red-500">{errors.fullName.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input {...register("email")} type="email" placeholder="john@example.com" />
                  {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input {...register("phoneNumber")} placeholder="9876543210" />
                  {errors.phoneNumber && <span className="text-sm text-red-500">{errors.phoneNumber.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input {...register("password")} type="password" />
                  {errors.password && <span className="text-sm text-red-500">{errors.password.message}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register("address")} placeholder="Full address" />
              </div>

              {/* Dynamic Fields */}
              {selectedRole === "trial_member" && (
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">Trial Details</h4>
                  <div className="space-y-2">
                    <Label>Assigned Area</Label>
                    <Input {...register("location.area")} placeholder="E.g., Downtown" />
                  </div>
                </div>
              )}

              {selectedRole === "member" && (
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">Membership Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Membership Plan</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("membershipPlan")}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === "supervisor" && (
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">Supervisor Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input {...register("employeeId")} placeholder="SUP-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned Zone</Label>
                      <Input {...register("assignedZone")} placeholder="North Zone" />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === "delivery_agent" && (
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">Agent Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input {...register("employeeId")} placeholder="AGT-001" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Input {...register("vehicleType")} placeholder="Truck / Van" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Number</Label>
                      <Input {...register("vehicleNumber")} placeholder="AB-12-CD-3456" />
                    </div>
                  </div>
                </div>
              )}

              {selectedRole === "recycler" && (
                <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4 mt-4">
                  <h4 className="font-semibold text-sm">Recycler Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input {...register("companyName")} placeholder="Eco Recycle Inc" />
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <Input {...register("licenseNumber")} placeholder="LIC-9988" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

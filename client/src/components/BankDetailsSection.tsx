import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Trash2, Lock, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, "Name must be at least 2 characters"),
  sortCode: z.string().min(6, "Sort code is required"),
  accountNumber: z.string().min(8, "Account number is required"),
});

type BankDetailsForm = z.infer<typeof bankDetailsSchema>;

export function BankDetailsSection() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: bankDetails, refetch } = trpc.bankDetails.get.useQuery();
  const saveMutation = trpc.bankDetails.save.useMutation();
  const removeMutation = trpc.bankDetails.remove.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BankDetailsForm>({
    resolver: zodResolver(bankDetailsSchema),
  });

  const onSubmit = async (data: BankDetailsForm) => {
    try {
      await saveMutation.mutateAsync(data);
      toast({
        title: "✅ Bank details saved",
        description: "Your bank details have been saved securely. Admin will verify them before your first payout.",
      });
      setIsEditing(false);
      reset();
      refetch();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to save bank details",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your bank details? You won't be able to receive payouts until you add them again.")) {
      return;
    }

    try {
      await removeMutation.mutateAsync();
      toast({
        title: "🗑️ Bank details removed",
        description: "Your bank details have been removed successfully.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to remove bank details",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Bank Details for Payouts
        </CardTitle>
        <CardDescription>
          Add your UK bank account to receive automatic payouts from your earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your bank details are encrypted and stored securely. Only admins can process payouts.
          </AlertDescription>
        </Alert>

        {/* Show existing details */}
        {bankDetails?.hasDetails && !isEditing ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Account Holder Name</p>
                  <p className="text-lg">{bankDetails.accountHolderName}</p>
                </div>
                {bankDetails.verified ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Pending Verification</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sort Code</p>
                  <p className="font-mono text-lg">{bankDetails.sortCodeMasked}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-mono text-lg">{bankDetails.accountNumberMasked}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Update Details
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            </div>

            {!bankDetails.verified && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your bank details are pending admin verification. Once verified, you'll be able to receive payouts.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                placeholder="John Smith"
                {...register("accountHolderName")}
                disabled={saveMutation.isPending}
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500">{errors.accountHolderName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortCode">Sort Code</Label>
              <Input
                id="sortCode"
                placeholder="12-34-56"
                {...register("sortCode")}
                disabled={saveMutation.isPending}
                maxLength={8}
              />
              {errors.sortCode && (
                <p className="text-sm text-red-500">{errors.sortCode.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: XX-XX-XX (e.g., 12-34-56)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="12345678"
                {...register("accountNumber")}
                disabled={saveMutation.isPending}
                maxLength={8}
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500">{errors.accountNumber.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                8 digits (e.g., 12345678)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1"
              >
                {saveMutation.isPending ? "Saving..." : "Save Bank Details"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

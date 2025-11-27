import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { PhoneInput } from "./ui/phone-input";

const verificationSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export function VerificationForm() {
  const verifyCode = useMutation(api.codes.verifyCode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    details?: { name: string; phone: string };
  } | null>(null);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = async (values: VerificationFormValues) => {
    try {
      const result = await verifyCode({
        code: values.code.trim(),
        name: values.name.trim(),
        phone: values.phone.trim(),
      });

      if (result.success) {
        setDialogData({
          type: "success",
          title: "Verification Successful",
          message: result.message || "Code verified successfully!",
          details: result.details,
        });
        setDialogOpen(true);

        if (result.verified && result.details) {
          form.reset({
            code: values.code.trim(),
            name: result.details.name,
            phone: result.details.phone,
          });
        } else {
          form.reset();
        }
      } else {
        setDialogData({
          type: "error",
          title: "Verification Failed",
          message: result.error || "Verification failed",
          details: result.existingDetails,
        });
        setDialogOpen(true);

        if (result.existingDetails) {
          form.reset({
            code: values.code.trim(),
            name: result.existingDetails.name,
            phone: result.existingDetails.phone,
          });
        }
      }
    } catch (err) {
      setDialogData({
        type: "error",
        title: "Error",
        message:
          err instanceof Error
            ? err.message
            : "An error occurred during verification",
      });
      setDialogOpen(true);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Verify Product Code
        </CardTitle>
        <CardDescription className="text-center">
          Enter your scratchable code and details to verify your product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {form.formState.errors.root.message}
              </div>
            )}

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter scratchable code"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the code from your product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Enter your full name</FormDescription>
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
                    <PhoneInput
                      defaultCountry="PK"
                      placeholder="Enter your phone number"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your contact phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        </Form>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              {dialogData?.type === "success" ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <DialogTitle>
                {dialogData?.title || "Verification Result"}
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {dialogData?.message}
            </DialogDescription>
          </DialogHeader>
          {dialogData?.details && (
            <div className="py-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Verified Details:
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {dialogData.details.name}
                </div>
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {dialogData.details.phone}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

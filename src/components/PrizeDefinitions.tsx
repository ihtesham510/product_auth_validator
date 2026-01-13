import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
} from "@/components/ui/form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Plus, Trash2, Edit } from "lucide-react";

const prizeDefinitionSchema = z.object({
    prize_name: z.string().min(1, "Prize name is required"),
    description: z.string().min(1, "Description is required"),
});

type PrizeDefinitionFormValues = z.infer<typeof prizeDefinitionSchema>;

export function PrizeDefinitions() {
    const prizeDefinitions = useQuery(api.prizes.getAllPrizeDefinitions);
    const createPrizeDefinition = useMutation(api.prizes.createPrizeDefinition);
    const updatePrizeDefinition = useMutation(api.prizes.updatePrizeDefinition);
    const deletePrizeDefinition = useMutation(api.prizes.deletePrizeDefinition);

    const [prizeDialogOpen, setPrizeDialogOpen] = useState(false);
    const [editingPrize, setEditingPrize] = useState<string | null>(null);

    const prizeForm = useForm<PrizeDefinitionFormValues>({
        resolver: zodResolver(prizeDefinitionSchema),
        defaultValues: {
            prize_name: "",
            description: "",
        },
    });

    const handlePrizeSubmit = async (values: PrizeDefinitionFormValues) => {
        try {
            if (editingPrize) {
                await updatePrizeDefinition({
                    prize_definition_id: editingPrize as any,
                    prize_name: values.prize_name.trim(),
                    description: values.description.trim(),
                });
            } else {
                await createPrizeDefinition({
                    prize_name: values.prize_name.trim(),
                    description: values.description.trim(),
                });
            }
            prizeForm.reset();
            setPrizeDialogOpen(false);
            setEditingPrize(null);
        } catch (err) {
            console.error("Failed to save prize definition:", err);
        }
    };

    const handleDeletePrize = async (prizeId: string) => {
        if (confirm("Are you sure you want to delete this prize definition?")) {
            try {
                await deletePrizeDefinition({ prize_definition_id: prizeId as any });
            } catch (err) {
                alert(err instanceof Error ? err.message : "Failed to delete prize");
            }
        }
    };

    const handleEditPrize = (prize: any) => {
        setEditingPrize(prize._id);
        prizeForm.reset({
            prize_name: prize.prize_name,
            description: prize.description,
        });
        setPrizeDialogOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Prize Definitions
                            </CardTitle>
                            <CardDescription>
                                Create and manage prize definitions
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingPrize(null);
                                prizeForm.reset();
                                setPrizeDialogOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Prize
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {prizeDefinitions && prizeDefinitions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No prize definitions found. Create one to get started.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Prize Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prizeDefinitions?.map((prize) => (
                                        <TableRow key={prize._id}>
                                            <TableCell className="font-medium">
                                                {prize.prize_name}
                                            </TableCell>
                                            <TableCell>{prize.description}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditPrize(prize)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeletePrize(prize._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Prize Definition Dialog */}
            <Dialog open={prizeDialogOpen} onOpenChange={setPrizeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPrize
                                ? "Edit Prize Definition"
                                : "Create Prize Definition"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPrize
                                ? "Update the prize definition details"
                                : "Create a new prize definition that can be assigned to codes"}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...prizeForm}>
                        <form
                            onSubmit={prizeForm.handleSubmit(handlePrizeSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={prizeForm.control}
                                name="prize_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prize Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Gold Prize" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={prizeForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the prize..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPrizeDialogOpen(false);
                                        setEditingPrize(null);
                                        prizeForm.reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingPrize ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}




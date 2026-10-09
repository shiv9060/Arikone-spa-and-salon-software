'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Ban, Check } from 'lucide-react';
import { actionUpdateExpenseStatus } from '@/app/dashboard/expenses/actions';
import { ExpenseStatus } from '@prisma/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function ExpenseStatusUpdater({ 
  expenseId, 
  status, 
  canApprove, 
  canCancel 
}: { 
  expenseId: string, 
  status: ExpenseStatus,
  canApprove: boolean,
  canCancel: boolean
}) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: ExpenseStatus) => {
    setLoading(true);
    try {
      await actionUpdateExpenseStatus(expenseId, newStatus);
      toast.success(`Expense status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'CANCELLED') return null;

  return (
    <DropdownMenu>
      {/* @ts-expect-error Radix UI asChild type incompatibility */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading} type="button">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === 'DRAFT' && canApprove && (
          <DropdownMenuItem onClick={() => updateStatus('PENDING')}>
            Mark as Pending
          </DropdownMenuItem>
        )}
        {status === 'PENDING' && canApprove && (
          <DropdownMenuItem onClick={() => updateStatus('APPROVED')}>
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
            Approve
          </DropdownMenuItem>
        )}
        {(status === 'APPROVED' || status === 'PENDING') && canApprove && (
          <DropdownMenuItem onClick={() => updateStatus('PAID')}>
            <Check className="w-4 h-4 mr-2 text-green-500" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        {status !== 'PAID' && canCancel && (
          <DropdownMenuItem onClick={() => updateStatus('CANCELLED')} className="text-red-600">
            <Ban className="w-4 h-4 mr-2" />
            Cancel Expense
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

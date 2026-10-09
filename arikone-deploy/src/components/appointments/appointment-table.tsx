'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function AppointmentTable({ appointments, pagination, userRole }: { appointments: any[]; pagination: any; userRole: string; }) {
  const router = useRouter();

  if (appointments.length === 0) {
    return (
      <div className="text-center p-8 bg-card rounded-xl border">
        <p className="text-muted-foreground">No appointments found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map(appointment => (
              <TableRow key={appointment.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}>
                <TableCell>
                  <div className="font-medium">{format(new Date(appointment.startTime), 'hh:mm a')}</div>
                  <div className="text-xs text-muted-foreground">to {format(new Date(appointment.endTime), 'hh:mm a')}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{appointment.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{appointment.customer.mobile}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{appointment.service.name}</div>
                  <div className="text-xs text-muted-foreground">{appointment.service.durationMinutes} min</div>
                </TableCell>
                <TableCell>{appointment.staff.name}</TableCell>
                <TableCell>
                  <Badge variant={appointment.status === 'COMPLETED' ? 'default' : appointment.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      {userRole !== 'STAFF' && (
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/appointments/${appointment.id}/edit`)}>
                          Edit
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination component here if needed */}
    </div>
  );
}

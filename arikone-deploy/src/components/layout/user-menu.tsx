'use client';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export function UserMenu({ 
  user 
}: { 
  user: { name: string; email: string; role: string; tenantName: string } 
}) {
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      {/* @ts-expect-error - asChild type issue */}
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">{user.name}</p>
            <p className="text-xs leading-none text-gray-500">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Role</span>
            <span className="font-medium text-gray-900">{user.role}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500 mt-1">
            <span>Business</span>
            <span className="font-medium text-gray-900 truncate ml-2">{user.tenantName}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-gray-700">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-gray-700">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

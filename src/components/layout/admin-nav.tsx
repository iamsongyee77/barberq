"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Scissors, Bot, Settings, LogOut, PanelLeft, CalendarDays, Clock, User } from "lucide-react"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { ADMIN_EMAILS } from "@/lib/types";
import { doc } from "firebase/firestore";
import type { PageContent } from "@/lib/types";
import { Skeleton } from "../ui/skeleton"

const allMenuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar, adminOnly: false },
  { href: "/admin/timeline", label: "Timeline", icon: Clock, adminOnly: false },
  { href: "/admin/customers", label: "Customers", icon: User, adminOnly: true },
  { href: "/admin/barbers", label: "Barbers", icon: Users, adminOnly: true },
  { href: "/admin/services", label: "Services", icon: Scissors, adminOnly: true },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarDays, adminOnly: true },
  { href: "/admin/queue-optimizer", label: "AI Optimizer", icon: Bot, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, adminOnly: true },
]

export function AdminNav() {
  const pathname = usePathname()
  const { user } = useUser();
  const firestore = useFirestore();

   const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pageContent', 'home');
  }, [firestore]);

  const { data: content, isLoading: isLoadingContent } = useDoc<PageContent>(contentRef);
  
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  
  const menuItems = isAdmin ? allMenuItems : allMenuItems.filter(item => !item.adminOnly);

  const shopName = content?.shopName || "SnipQueue";

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex w-full items-center justify-between p-2">
          <div className="flex items-center gap-2 [&_span]:font-bold [&_span]:text-lg">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">
              {isLoadingContent ? <Skeleton className="h-6 w-28" /> : shopName}
            </span>
          </div>
          <SidebarTrigger>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{
                  children: item.label,
                }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "Back to Site" }}>
                <Link href="/">
                    <LogOut className="rotate-180" />
                    <span>Back to Site</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

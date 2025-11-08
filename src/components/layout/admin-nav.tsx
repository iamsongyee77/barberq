"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Scissors, Bot, Settings, LogOut, PanelLeft, CalendarDays, Clock } from "lucide-react"

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

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/barbers", label: "Barbers", icon: Users },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarDays },
  { href: "/admin/timeline", label: "Timeline", icon: Clock },
  { href: "/admin/queue-optimizer", label: "AI Optimizer", icon: Bot },
]

export function AdminNav() {
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader>
        <div className="flex w-full items-center justify-between p-2">
          <div className="flex items-center gap-2 [&_span]:font-bold [&_span]:text-lg">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">
              SnipQueue
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

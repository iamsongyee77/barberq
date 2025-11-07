"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Scissors, Bot, Settings, LogOut, PanelLeft } from "lucide-react"

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
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden">
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
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
            <Link href="/" legacyBehavior passHref>
                <SidebarMenuButton tooltip={{ children: "Back to Site" }}>
                <LogOut className="rotate-180" />
                <span>Back to Site</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

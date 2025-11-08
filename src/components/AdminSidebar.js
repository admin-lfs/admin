"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../components/ui/sidebar";
import {
  Users,
  Megaphone,
  CreditCard,
  LogOut,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "../components/ui/button";

// Separate component for menu items that can use useSidebar hook
const SidebarMenuItems = ({ menuItems, activePage, onPageChange }) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.page}>
          <SidebarMenuButton
            onClick={() => {
              onPageChange(item.page);
              // Close sidebar on mobile after navigation
              if (window.innerWidth < 768) {
                setOpenMobile(false);
              }
            }}
            className={`w-full ${
              activePage === item.page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span className="font-medium">{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

const AdminSidebar = ({ children, activePage, onPageChange }) => {
  const { logout } = useAuth();

  const menuItems = [
    {
      title: "General",
      icon: Settings,
      page: "general",
    },
    {
      title: "Onboarding",
      icon: Users,
      page: "onboarding",
    },
    {
      title: "Announcements",
      icon: Megaphone,
      page: "announcements",
    },
    {
      title: "Fees Collection",
      icon: CreditCard,
      page: "fees",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center justify-end group-data-[collapsible=icon]:justify-center">
              <SidebarTrigger className="h-8 w-8 p-0" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenuItems
                  menuItems={menuItems}
                  activePage={activePage}
                  onPageChange={onPageChange}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="p-4 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </SidebarTrigger>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminSidebar;

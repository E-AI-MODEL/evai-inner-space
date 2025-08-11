import React from 'react';
import { User, BarChart3, Database, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
  active: 'profile' | 'overview' | 'seeds' | 'analytics' | 'settings';
  onChange: (value: AdminSidebarProps['active']) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ active, onChange }) => {
  const items = [
    { key: 'profile', label: 'Profiel', icon: User },
    { key: 'overview', label: 'Overzicht', icon: BarChart3 },
    { key: 'seeds', label: 'Seeds', icon: Database },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Configuratie', icon: Settings },
  ] as const;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={active === item.key}
                    onClick={() => onChange(item.key)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;

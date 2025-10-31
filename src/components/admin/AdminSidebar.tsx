import React from 'react';
import { User, BarChart3, Database, Settings, Zap, Cpu, AlertOctagon, Eye, Wrench } from 'lucide-react';
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

type ActiveTab = 'autonomy' | 'seeds' | 'settings' | 'hitl' | 'ngbse' | 'healing';

interface AdminSidebarProps {
  active: ActiveTab;
  onChange: (value: ActiveTab) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ active, onChange }) => {
  const items: { key: ActiveTab; label: string; icon: typeof Zap }[] = [
    { key: 'autonomy', label: 'Autonomous', icon: Zap },
    { key: 'seeds', label: 'Knowledge', icon: Database },
    { key: 'hitl', label: 'HITL Queue', icon: AlertOctagon },
    { key: 'ngbse', label: 'Blindspots', icon: Eye },
    { key: 'healing', label: 'Auto-Heal', icon: Wrench },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

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
                    onClick={() => onChange(item.key)}
                    isActive={active === item.key}
                  >
                    <item.icon className="h-4 w-4" />
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

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, LogOut, Settings, FileText, Users, Zap, LayoutTemplate, CalendarClock, BookOpen } from "lucide-react";
import CertificatesManagement from "./dashboard/certificates-management";
import ClientsPage from "./dashboard/Clients";
import SettingsPage from "./dashboard/Settings";
import TemplatesPage from "./dashboard/Templates";
import InspectionsPage from "./dashboard/Inspections";
import HowItWorksPage from "./dashboard/HowItWorks";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("certificates");

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-gray-900">CertIA</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Certificados"
            active={activeTab === "certificates"}
            onClick={() => setActiveTab("certificates")}
            collapsed={!sidebarOpen}
          />
          <NavItem
            icon={<Users className="w-5 h-5" />}
            label="Clientes"
            active={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
            collapsed={!sidebarOpen}
          />
          <NavItem
            icon={<LayoutTemplate className="w-5 h-5" />}
            label="Plantillas"
            active={activeTab === "templates"}
            onClick={() => setActiveTab("templates")}
            collapsed={!sidebarOpen}
          />
          <NavItem
            icon={<CalendarClock className="w-5 h-5" />}
            label="Revisiones"
            active={activeTab === "inspections"}
            onClick={() => setActiveTab("inspections")}
            collapsed={!sidebarOpen}
          />
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Cómo funciona"
            active={activeTab === "howitworks"}
            onClick={() => setActiveTab("howitworks")}
            collapsed={!sidebarOpen}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Configuración"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            collapsed={!sidebarOpen}
          />
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {sidebarOpen && (
            <div className="text-sm">
              <p className="font-medium text-gray-900 truncate">{user?.name || "Usuario"}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Gestiona tus certificados e instalaciones</p>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden">
            <TabsList>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="certificates" className="space-y-4">
              <CertificatesManagement />
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              <ClientsPage />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SettingsPage />
            </TabsContent>
          </Tabs>

          {/* Content by Tab */}
          {activeTab === "certificates" && <CertificatesManagement />}
          {activeTab === "clients" && <ClientsPage />}
          {activeTab === "templates" && <TemplatesPage />}
          {activeTab === "inspections" && <InspectionsPage />}
          {activeTab === "howitworks" && <HowItWorksPage />}
          {activeTab === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

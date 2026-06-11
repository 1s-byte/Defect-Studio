/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { FloorManager } from "./components/FloorManager";
import { CellManager } from "./components/CellManager";
import { ProductManager } from "./components/ProductManager";
import { OperationManager } from "./components/OperationManager";
import { WorkerManager } from "./components/WorkerManager";
import { UserManager } from "./components/UserManager";
import { DefectCauseManager } from "./components/DefectCauseManager";
import { Login } from "./components/Login";
import { QIDashboard } from "./components/QIDashboard";
import { ReportManager } from "./components/ReportManager";
import { LayoutDashboard, Users, Factory, Layers, KeySquare, Download, LogOut, ShieldAlert, AlertOctagon, FileSpreadsheet } from "lucide-react";
import { api, clearAuth } from "./api";

type Tab = "Floors" | "Cells" | "Products" | "Operations" | "Workers" | "Users" | "DefectCauses" | "Reports";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Floors");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken && storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    clearAuth();
    setRole(null);
    localStorage.removeItem("user_role");
  };

  const handleDownload = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qc_database_export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to download database.");
    }
  };

  if (!role) {
    return <Login onLogin={(r) => setRole(r)} />;
  }

  if (role === "QI") {
    return <QIDashboard />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "Floors": return <FloorManager />;
      case "Cells": return <CellManager />;
      case "Products": return <ProductManager />;
      case "Operations": return <OperationManager />;
      case "Workers": return <WorkerManager />;
      case "Users": return <UserManager />;
      case "DefectCauses": return <DefectCauseManager />;
      case "Reports": return <ReportManager />;
    }
  };

  const tabs: { id: Tab, label: string, icon: any }[] = [
    { id: "Floors", label: "Floors", icon: LayoutDashboard },
    { id: "Cells", label: "Cells", icon: Factory },
    { id: "Products", label: "Products", icon: Layers },
    { id: "Operations", label: "Operations", icon: KeySquare },
    { id: "Workers", label: "Personnel", icon: Users },
    { id: "DefectCauses", label: "Defect Causes", icon: AlertOctagon },
    { id: "Reports", label: "Reports", icon: FileSpreadsheet },
    { id: "Users", label: "System Users", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 text-white p-1.5 rounded-md">
              <Factory size={20} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">QC Admin System</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-1.5 hover:text-gray-900 transition-colors bg-gray-100 px-3 py-1.5 rounded"
            >
              <Download size={14} />
              Export DB
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 hover:text-red-600 transition-colors px-2 py-1.5"
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 flex gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "border-gray-900 text-gray-900" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
            <h2 className="text-lg font-medium text-gray-800">
              Manage {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          <div className="p-6">
            {renderTab()}
          </div>
        </div>
      </main>
    </div>
  );
}

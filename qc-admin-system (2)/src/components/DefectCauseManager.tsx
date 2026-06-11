import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { DefectCause } from "../types";
import { Trash2, Plus, Edit2, Download, Upload, AlertOctagon } from "lucide-react";
import { downloadCSV, parseCSV } from "../csvUtils";

export function DefectCauseManager() {
  const [causes, setCauses] = useState<DefectCause[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"In-Cell Process" | "Raw Material">("In-Cell Process");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"In-Cell Process" | "Raw Material">("In-Cell Process");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getDefectCauses();
      setCauses(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!createName || !createType) return;
    await api.createDefectCause({ name: createName, type: createType });
    setCreateName("");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editType) return;
    await api.updateDefectCause(id, { name: editName, type: editType });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete defect cause?")) return;
    await api.deleteDefectCause(id);
    loadData();
  };

  const handleExport = () => {
    const exportData = causes.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type
    }));
    downloadCSV(exportData, "defect_causes_export");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) return;
      
      setLoading(true);
      for (const row of parsed) {
        if (!row.name) continue;
        const type = row.type === 'Raw Material' ? 'Raw Material' : 'In-Cell Process';
        
        if (row.id && causes.find(c => c.id === row.id)) {
          await api.updateDefectCause(row.id, { name: row.name, type });
        } else {
          await api.createDefectCause({ name: row.name, type });
        }
      }
      setLoading(false);
      loadData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading defect causes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={handleExport} className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Export to Excel (CSV)">
          <Download size={16} /> Export
        </button>
        <label className="cursor-pointer bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Import from Excel (CSV)">
          <Upload size={16} /> Import
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
        </label>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md p-4 space-y-4 shadow-sm">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <AlertOctagon size={16} /> Add Defect Cause
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none flex-1 min-w-[200px]" placeholder="Defect Name" value={createName} onChange={e => setCreateName(e.target.value)} />
          <select className="border border-gray-300 rounded px-3 py-1.5 bg-white flex-1 min-w-[150px]" value={createType} onChange={e => setCreateType(e.target.value as any)}>
            <option value="In-Cell Process">In-Cell Process</option>
            <option value="Raw Material">Raw Material</option>
          </select>
          <button className="bg-gray-900 text-white px-4 py-1.5 rounded font-medium hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap" onClick={handleCreate}>
            <Plus size={16} /> Add Cause
          </button>
        </div>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2 px-4 font-medium">Defect Name</th>
              <th className="py-2 px-4 font-medium">Type</th>
              <th className="py-2 px-4 font-medium w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {causes.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-2 px-4">
                  {editId === c.id ? (
                     <input className="border border-gray-300 rounded px-2 py-1 w-full" value={editName} onChange={e => setEditName(e.target.value)} />
                  ) : <span className="font-medium text-gray-900">{c.name}</span>}
                </td>
                <td className="py-2 px-4 whitespace-nowrap">
                  {editId === c.id ? (
                     <select className="border border-gray-300 rounded px-2 py-1 bg-white" value={editType} onChange={e => setEditType(e.target.value as any)}>
                        <option value="In-Cell Process">In-Cell Process</option>
                        <option value="Raw Material">Raw Material</option>
                     </select>
                  ) : (
                     <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.type === 'In-Cell Process' ? 'bg-orange-100 text-orange-800' : 'bg-pink-100 text-pink-800'}`}>
                        {c.type}
                     </span>
                  )}
                </td>
                <td className="py-2 px-4 text-right">
                  {editId === c.id ? (
                    <div className="flex justify-end gap-2">
                       <button className="text-gray-500 hover:text-gray-700 text-xs font-medium" onClick={() => setEditId(null)}>Cancel</button>
                       <button className="text-blue-600 hover:text-blue-800 text-xs font-medium" onClick={() => handleUpdate(c.id)}>Save</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(c.id); setEditName(c.name); setEditType(c.type); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {causes.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">No defect causes configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

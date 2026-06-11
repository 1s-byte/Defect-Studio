import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Worker, Cell } from "../types";
import { Trash2, Plus, Edit2, CheckSquare, Download, Upload } from "lucide-react";
import { downloadCSV, parseCSV } from "../csvUtils";

export function WorkerManager() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"Tailor" | "Quality Inspector">("Tailor");
  const [newShift, setNewShift] = useState<"Group A" | "Group B">("Group A");
  const [newCellId, setNewCellId] = useState("");
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"Tailor" | "Quality Inspector">("Tailor");
  const [editShift, setEditShift] = useState<"Group A" | "Group B">("Group A");
  const [editCellId, setEditCellId] = useState("");

  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  
  // Bulk edit state
  const [bulkShift, setBulkShift] = useState<"Group A" | "Group B" | "">("");
  const [bulkCellId, setBulkCellId] = useState<string>("");
  const [bulkRole, setBulkRole] = useState<"Tailor" | "Quality Inspector" | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [workersData, cellsData] = await Promise.all([api.getWorkers(), api.getCells()]);
    setWorkers(workersData);
    setCells(cellsData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await api.createWorker({ name: newName, role: newRole, shift: newShift, cellId: newCellId || null });
    setNewName("");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await api.updateWorker(id, { name: editName, role: editRole, shift: editShift, cellId: editCellId || null });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete worker?")) return;
    await api.deleteWorker(id);
    loadData();
  };

  const handleExport = () => {
    const exportData = workers.map(w => ({
      id: w.id,
      name: w.name,
      role: w.role,
      shift: w.shift,
      cellId: w.cellId,
      cellName: cells.find(c => c.id === w.cellId)?.name || ""
    }));
    downloadCSV(exportData, "personnel_export");
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
        
        let targetCellId = row.cellId;
        if (!targetCellId && row.cellName) {
           const cell = cells.find(c => c.name === row.cellName);
           if (cell) targetCellId = cell.id;
        }

        const workerRole = row.role === 'Quality Inspector' ? 'Quality Inspector' : 'Tailor';
        const workerShift = row.shift === 'Group B' ? 'Group B' : 'Group A';

        if (row.id && workers.find(w => w.id === row.id)) {
          // Update
          await api.updateWorker(row.id, { name: row.name, role: workerRole, shift: workerShift, cellId: targetCellId || null });
        } else {
          // Create
          await api.createWorker({ name: row.name, role: workerRole, shift: workerShift, cellId: targetCellId || null });
        }
      }
      setLoading(false);
      loadData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const toggleSelection = (id: string) => {
    const next = new Set(selectedWorkers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWorkers(next);
  };

  const handleBulkUpdate = async () => {
    if (selectedWorkers.size === 0) return;
    const overrides: Partial<Worker> = {};
    if (bulkShift) overrides.shift = bulkShift;
    if (bulkRole) overrides.role = bulkRole;
    if (bulkCellId !== "") overrides.cellId = bulkCellId === "none" ? null : bulkCellId;
    
    if (Object.keys(overrides).length === 0) return;
    
    await api.bulkUpdateWorkers(Array.from(selectedWorkers), overrides);
    
    setBulkShift("");
    setBulkCellId("");
    setBulkRole("");
    setSelectedWorkers(new Set());
    loadData();
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading workers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={handleExport} className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Export to Excel (CSV)">
          <Download size={16} /> Export Personnel
        </button>
        <label className="cursor-pointer bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Import from Excel (CSV)">
          <Upload size={16} /> Import Personnel
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
        </label>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md p-4 space-y-4">
        <h3 className="font-medium text-gray-800">Add New Worker</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input 
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
            placeholder="Worker Name" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
          />
          <select 
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
            value={newRole}
            onChange={e => setNewRole(e.target.value as any)}
          >
            <option value="Tailor">Tailor</option>
            <option value="Quality Inspector">Quality Inspector</option>
          </select>
          <select 
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
            value={newShift}
            onChange={e => setNewShift(e.target.value as any)}
          >
            <option value="Group A">Group A</option>
            <option value="Group B">Group B</option>
          </select>
          <select 
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
            value={newCellId}
            onChange={e => setNewCellId(e.target.value)}
          >
            <option value="">No Cell Assignment</option>
            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={handleCreate}>
            <Plus size={16} /> Add Worker
          </button>
        </div>
      </div>

      {selectedWorkers.size > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 flex flex-wrap items-center gap-4 shadow-sm animate-in fade-in">
          <div className="text-sm font-medium text-blue-900">
            {selectedWorkers.size} selected
          </div>
          <div className="h-4 w-px bg-blue-200"></div>
          <select 
            className="border border-blue-200 rounded px-2 py-1 text-sm bg-white"
            value={bulkRole}
            onChange={e => setBulkRole(e.target.value as any)}
          >
            <option value="">Update Role...</option>
            <option value="Tailor">Tailor</option>
            <option value="Quality Inspector">Quality Inspector</option>
          </select>
          <select 
            className="border border-blue-200 rounded px-2 py-1 text-sm bg-white"
            value={bulkShift}
            onChange={e => setBulkShift(e.target.value as any)}
          >
            <option value="">Update Shift...</option>
            <option value="Group A">Group A</option>
            <option value="Group B">Group B</option>
          </select>
          <select 
            className="border border-blue-200 rounded px-2 py-1 text-sm bg-white"
            value={bulkCellId}
            onChange={e => setBulkCellId(e.target.value)}
          >
            <option value="">Update Assignment...</option>
            <option value="none">Unassign Cell</option>
            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 ml-auto"
            onClick={handleBulkUpdate}
          >
            Apply Changes
          </button>
        </div>
      )}

      <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedWorkers.size === workers.length && workers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWorkers(new Set(workers.map(w => w.id)));
                    } else {
                      setSelectedWorkers(new Set());
                    }
                  }}
                />
              </th>
              <th className="px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 font-medium text-gray-700">Shift</th>
              <th className="px-4 py-3 font-medium text-gray-700">Assignment</th>
              <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No workers found.</td></tr>
            )}
            {workers.map(worker => (
              <tr key={worker.id} className={`hover:bg-gray-50 ${selectedWorkers.has(worker.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedWorkers.has(worker.id)}
                    onChange={() => toggleSelection(worker.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  {editId === worker.id ? (
                    <input 
                      autoFocus
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  ) : <span className="text-gray-900 font-medium">{worker.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === worker.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as any)}
                    >
                      <option value="Tailor">Tailor</option>
                      <option value="Quality Inspector">Quality Inspector</option>
                    </select>
                  ) : <span className="text-gray-600">{worker.role}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === worker.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editShift}
                      onChange={e => setEditShift(e.target.value as any)}
                    >
                      <option value="Group A">Group A</option>
                      <option value="Group B">Group B</option>
                    </select>
                  ) : <span className="text-gray-600 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100">{worker.shift}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === worker.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editCellId}
                      onChange={e => setEditCellId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : <span className="text-gray-600">{worker.cellId ? cells.find(c => c.id === worker.cellId)?.name || 'Unknown' : 'Unassigned'}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === worker.id ? (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(worker.id)}>Save</button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { 
                        setEditId(worker.id); 
                        setEditName(worker.name); 
                        setEditRole(worker.role);
                        setEditShift(worker.shift);
                        setEditCellId(worker.cellId || ""); 
                      }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(worker.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

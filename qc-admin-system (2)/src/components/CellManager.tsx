import { useState, useEffect } from "react";
import { api } from "../api";
import { Cell, Floor } from "../types";
import { Trash2, Plus, Edit2 } from "lucide-react";

export function CellManager() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState("");
  const [newFloorId, setNewFloorId] = useState("");
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFloorId, setEditFloorId] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [cellsData, floorsData] = await Promise.all([api.getCells(), api.getFloors()]);
    setCells(cellsData);
    setFloors(floorsData);
    if (floorsData.length > 0 && !newFloorId) setNewFloorId(floorsData[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newFloorId) return;
    await api.createCell({ name: newName, floorId: newFloorId });
    setNewName("");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editFloorId) return;
    await api.updateCell(id, { name: editName, floorId: editFloorId });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete cell and unassign associated products/workers?")) return;
    await api.deleteCell(id);
    loadData();
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading cells...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input 
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
          placeholder="New Cell Name" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)}
        />
        <select 
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
          value={newFloorId}
          onChange={e => setNewFloorId(e.target.value)}
        >
          {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={handleCreate}>
          <Plus size={16} /> Add Cell
        </button>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Cell Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Floor</th>
              <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cells.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No cells found.</td></tr>
            )}
            {cells.map(cell => (
              <tr key={cell.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editId === cell.id ? (
                    <input 
                      autoFocus
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  ) : <span className="text-gray-900">{cell.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === cell.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editFloorId}
                      onChange={e => setEditFloorId(e.target.value)}
                    >
                      {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  ) : <span className="text-gray-600">{floors.find(f => f.id === cell.floorId)?.name || "Unknown"}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === cell.id ? (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(cell.id)}>Save</button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(cell.id); setEditName(cell.name); setEditFloorId(cell.floorId); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(cell.id)}>
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

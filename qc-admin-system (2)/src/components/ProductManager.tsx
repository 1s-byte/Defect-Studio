import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Product, Cell } from "../types";
import { Trash2, Plus, Edit2, Download, Upload, Map } from "lucide-react";
import { downloadCSV, parseCSV } from "../csvUtils";
import { ZoneEditor } from "./ZoneEditor";

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState("");
  const [newCellId, setNewCellId] = useState("");
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCellId, setEditCellId] = useState("");

  const [activeZoneEditorProductId, setActiveZoneEditorProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [productsData, cellsData] = await Promise.all([api.getProducts(), api.getCells()]);
    setProducts(productsData);
    setCells(cellsData);
    if (cellsData.length > 0 && !newCellId) setNewCellId(cellsData[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newCellId) return;
    await api.createProduct({ name: newName, cellId: newCellId });
    setNewName("");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editCellId) return;
    await api.updateProduct(id, { name: editName, cellId: editCellId });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete product and associated operations?")) return;
    await api.deleteProduct(id);
    loadData();
  };

  const handleExport = () => {
    const exportData = products.map(p => ({
      id: p.id,
      name: p.name,
      cellId: p.cellId,
      cellName: cells.find(c => c.id === p.cellId)?.name || ""
    }));
    downloadCSV(exportData, "products_export");
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

        if (row.id && products.find(p => p.id === row.id)) {
          // Update
          await api.updateProduct(row.id, { name: row.name, cellId: targetCellId || null });
        } else {
          // Create
          await api.createProduct({ name: row.name, cellId: targetCellId || cells[0]?.id || null });
        }
      }
      setLoading(false);
      loadData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading products...</div>;
  if (activeZoneEditorProductId) {
    return (
      <ZoneEditor 
        productId={activeZoneEditorProductId} 
        onBack={() => {
          setActiveZoneEditorProductId(null);
          loadData();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input 
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
          placeholder="New Product Name" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)}
        />
        <select 
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
          value={newCellId}
          onChange={e => setNewCellId(e.target.value)}
        >
          {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={handleCreate}>
          <Plus size={16} /> Add Product
        </button>
        <button onClick={handleExport} className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Export to Excel (CSV)">
          <Download size={16} /> Export
        </button>
        <label className="cursor-pointer bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2" title="Import from Excel (CSV)">
          <Upload size={16} /> Import
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
        </label>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Product Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Manf. Cell</th>
              <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No products found.</td></tr>
            )}
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editId === product.id ? (
                    <input 
                      autoFocus
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  ) : <span className="text-gray-900">{product.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === product.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editCellId}
                      onChange={e => setEditCellId(e.target.value)}
                    >
                      {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : <span className="text-gray-600">{cells.find(c => c.id === product.cellId)?.name || "Unknown"}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === product.id ? (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(product.id)}>Save</button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-blue-600" onClick={() => setActiveZoneEditorProductId(product.id)} title="Configure Zones">
                        <Map size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(product.id); setEditName(product.name); setEditCellId(product.cellId); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(product.id)}>
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

import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { Operation, Product } from "../types";
import { Trash2, Plus, Edit2, Download, Upload } from "lucide-react";
import { downloadCSV, parseCSV } from "../csvUtils";

export function OperationManager() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState("");
  const [newProductId, setNewProductId] = useState("");
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editProductId, setEditProductId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const [opsData, prodsData] = await Promise.all([api.getOperations(), api.getProducts()]);
    setOperations(opsData);
    setProducts(prodsData);
    if (prodsData.length > 0 && !newProductId) setNewProductId(prodsData[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newProductId) return;
    await api.createOperation({ name: newName, productId: newProductId });
    setNewName("");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editProductId) return;
    await api.updateOperation(id, { name: editName, productId: editProductId });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete operation?")) return;
    await api.deleteOperation(id);
    loadData();
  };

  const handleExport = () => {
    const exportData = operations.map(o => ({
      id: o.id,
      name: o.name,
      productId: o.productId,
      productName: products.find(p => p.id === o.productId)?.name || ""
    }));
    downloadCSV(exportData, "operations_export");
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
        
        let targetProductId = row.productId;
        if (!targetProductId && row.productName) {
           const product = products.find(p => p.name === row.productName);
           if (product) targetProductId = product.id;
        }

        if (row.id && operations.find(o => o.id === row.id)) {
          // Update
          await api.updateOperation(row.id, { name: row.name, productId: targetProductId || null });
        } else {
          // Create
          await api.createOperation({ name: row.name, productId: targetProductId || products[0]?.id || null });
        }
      }
      setLoading(false);
      loadData();
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading operations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input 
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
          placeholder="New Operation Name (e.g. Cutting)" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)}
        />
        <select 
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
          value={newProductId}
          onChange={e => setNewProductId(e.target.value)}
        >
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={handleCreate}>
          <Plus size={16} /> Add Operation
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
              <th className="px-4 py-3 font-medium text-gray-700">Operation Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Product</th>
              <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operations.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No operations found.</td></tr>
            )}
            {operations.map(op => (
              <tr key={op.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editId === op.id ? (
                    <input 
                      autoFocus
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  ) : <span className="text-gray-900">{op.name}</span>}
                </td>
                <td className="px-4 py-3">
                  {editId === op.id ? (
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={editProductId}
                      onChange={e => setEditProductId(e.target.value)}
                    >
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ) : <span className="text-gray-600">{products.find(p => p.id === op.productId)?.name || "Unknown"}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === op.id ? (
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(op.id)}>Save</button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(op.id); setEditName(op.name); setEditProductId(op.productId); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(op.id)}>
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

import { useState, useEffect } from "react";
import { api } from "../api";
import { Floor, Cell, Product, Operation, Worker } from "../types";
import { Trash2, Plus, Edit2, ChevronRight, ArrowLeft, Target } from "lucide-react";
import { ZoneEditor } from "./ZoneEditor";

export function FloorManager() {
  // Navigation states
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingZonesForProductId, setEditingZonesForProductId] = useState<string | null>(null);

  // Data states
  const [floors, setFloors] = useState<Floor[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<any>("Tailor");
  const [editShift, setEditShift] = useState<any>("Group A");
  
  // New entry states
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<any>("Tailor");
  const [newShift, setNewShift] = useState<any>("Group A");

  // Worker filter state
  const [workerShiftFilter, setWorkerShiftFilter] = useState<string>("All");

  const loadData = async () => {
    setLoading(true);
    const [f, c, p, o, w] = await Promise.all([
      api.getFloors(),
      api.getCells(),
      api.getProducts(),
      api.getOperations(),
      api.getWorkers(),
    ]);
    setFloors(f);
    setCells(c);
    setProducts(p);
    setOperations(o);
    setWorkers(w);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (type: "Floor" | "Cell" | "Product" | "Operation" | "Worker") => {
    if (!newName.trim()) return;
    if (type === "Floor") await api.createFloor({ name: newName });
    if (type === "Cell") await api.createCell({ name: newName, floorId: selectedFloorId! });
    if (type === "Product") await api.createProduct({ name: newName, cellId: selectedCellId! });
    if (type === "Operation") await api.createOperation({ name: newName, productId: selectedProductId! });
    if (type === "Worker") await api.createWorker({ name: newName, cellId: selectedCellId!, role: newRole, shift: newShift });
    
    setNewName("");
    loadData();
  };

  const handleUpdate = async (id: string, type: "Floor" | "Cell" | "Product" | "Operation" | "Worker") => {
    if (!editName.trim()) return;
    if (type === "Floor") await api.updateFloor(id, { name: editName });
    if (type === "Cell") await api.updateCell(id, { name: editName });
    if (type === "Product") await api.updateProduct(id, { name: editName });
    if (type === "Operation") await api.updateOperation(id, { name: editName });
    if (type === "Worker") await api.updateWorker(id, { name: editName, role: editRole, shift: editShift });
    setEditId(null);
    loadData();
  };

  const handleDelete = async (id: string, type: "Floor" | "Cell" | "Product" | "Operation" | "Worker") => {
    if (!confirm(`Delete ${type.toLowerCase()}?`)) return;
    if (type === "Floor") await api.deleteFloor(id);
    if (type === "Cell") await api.deleteCell(id);
    if (type === "Product") await api.deleteProduct(id);
    if (type === "Operation") await api.deleteOperation(id);
    if (type === "Worker") await api.deleteWorker(id);
    loadData();
  };

  const breadcrumbs = [
    { label: "Floors", onClick: () => { setSelectedFloorId(null); setSelectedCellId(null); setSelectedProductId(null); } },
    ...(selectedFloorId ? [{ label: floors.find(f => f.id === selectedFloorId)?.name || "Floor", onClick: () => { setSelectedCellId(null); setSelectedProductId(null); } }] : []),
    ...(selectedCellId ? [{ label: cells.find(c => c.id === selectedCellId)?.name || "Cell", onClick: () => { setSelectedProductId(null); } }] : []),
    ...(selectedProductId ? [{ label: products.find(p => p.id === selectedProductId)?.name || "Product", onClick: () => {} }] : []),
  ];

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading hierarchy view...</div>;

  const currentLevel = selectedProductId ? "Operations" : selectedCellId ? "Products" : selectedFloorId ? "Cells" : "Floors";

  if (editingZonesForProductId) {
    return (
      <ZoneEditor 
        productId={editingZonesForProductId} 
        onBack={() => setEditingZonesForProductId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-md border border-gray-100">
        {breadcrumbs.map((bc, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button 
              onClick={bc.onClick}
              className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? "font-medium text-gray-900" : ""}`}
            >
              {bc.label}
            </button>
            {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
          </div>
        ))}
      </div>

      {currentLevel === "Floors" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
              placeholder="New Floor Name" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate("Floor")}
            />
            <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={() => handleCreate("Floor")}>
              <Plus size={16} /> Add Floor
            </button>
          </div>
          <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Floor Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {floors.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No floors found.</td></tr>}
                {floors.map(floor => (
                  <tr key={floor.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => setSelectedFloorId(floor.id)}>
                    <td className="px-4 py-3 text-blue-600 group-hover:underline">
                      {editId === floor.id ? (
                        <input 
                          autoFocus
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-normal text-gray-900"
                          value={editName}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleUpdate(floor.id, "Floor");
                            if (e.key === "Escape") setEditId(null);
                          }}
                        />
                      ) : floor.name}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {editId === floor.id ? (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(floor.id, "Floor")}>Save</button>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-100">
                          <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(floor.id); setEditName(floor.name); }}>
                            <Edit2 size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(floor.id, "Floor")}>
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
      )}

      {currentLevel === "Cells" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
              placeholder="New Cell Name" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate("Cell")}
            />
            <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={() => handleCreate("Cell")}>
              <Plus size={16} /> Add Cell
            </button>
          </div>
          <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Cell Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cells.filter(c => c.floorId === selectedFloorId).length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No cells found on this floor.</td></tr>}
                {cells.filter(c => c.floorId === selectedFloorId).map(cell => (
                  <tr key={cell.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => setSelectedCellId(cell.id)}>
                    <td className="px-4 py-3 text-blue-600 group-hover:underline">
                      {editId === cell.id ? (
                        <input 
                          autoFocus
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-normal text-gray-900"
                          value={editName}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditName(e.target.value)}
                        />
                      ) : cell.name}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {editId === cell.id ? (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(cell.id, "Cell")}>Save</button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(cell.id); setEditName(cell.name); }}>
                            <Edit2 size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(cell.id, "Cell")}>
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
      )}

      {currentLevel === "Products" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
              placeholder="New Product Name" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate("Product")}
            />
            <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 flex items-center gap-2" onClick={() => handleCreate("Product")}>
              <Plus size={16} /> Add Product
            </button>
          </div>
          <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Product Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.filter(p => p.cellId === selectedCellId).length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No products found in this cell.</td></tr>}
                {products.filter(p => p.cellId === selectedCellId).map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => setSelectedProductId(product.id)}>
                    <td className="px-4 py-3 text-blue-600 group-hover:underline">
                      {editId === product.id ? (
                        <input 
                          autoFocus
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-normal text-gray-900"
                          value={editName}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditName(e.target.value)}
                        />
                      ) : product.name}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      {editId === product.id ? (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(product.id, "Product")}>Save</button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-400 hover:text-blue-600 flex items-center gap-1 text-xs font-medium bg-blue-50 px-2 py-1 rounded" onClick={() => setEditingZonesForProductId(product.id)}>
                            <Target size={14} /> Zones
                          </button>
                          <button className="text-gray-400 hover:text-gray-900 ml-2" onClick={() => { setEditId(product.id); setEditName(product.name); }}>
                            <Edit2 size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(product.id, "Product")}>
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
      )}

      {currentLevel === "Operations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Left Column: Operations */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Operations for Product</h3>
            <div className="flex gap-2">
              <input 
                autoFocus
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" 
                placeholder="New Operation" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate("Operation")}
              />
              <button className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800" onClick={() => handleCreate("Operation")}>
                Add
              </button>
            </div>
            <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Operation Name</th>
                    <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {operations.filter(o => o.productId === selectedProductId).length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No operations found.</td></tr>}
                  {operations.filter(o => o.productId === selectedProductId).map(op => (
                    <tr key={op.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {editId === op.id ? (
                          <input 
                            autoFocus
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-normal text-gray-900"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                          />
                        ) : op.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editId === op.id ? (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(op.id, "Operation")}>Save</button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(op.id); setEditName(op.name); }}>
                              <Edit2 size={16} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(op.id, "Operation")}>
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

          {/* Right Column: Workers Assigned to the CELL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-medium text-gray-900">Workers in Cell</h3>
              <select 
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700"
                value={workerShiftFilter}
                onChange={e => setWorkerShiftFilter(e.target.value)}
              >
                <option value="All">All Shifts</option>
                <option value="Group A">Group A</option>
                <option value="Group B">Group B</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Quick Assign Worker</div>
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" 
                  placeholder="Name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                />
                <select className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  <option value="Tailor">Tailor</option>
                  <option value="Quality Inspector">QI</option>
                </select>
                <select className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white" value={newShift} onChange={e => setNewShift(e.target.value)}>
                  <option value="Group A">Grp A</option>
                  <option value="Group B">Grp B</option>
                </select>
              </div>
              <button className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-800 w-full" onClick={() => handleCreate("Worker")}>
                Add to Cell
              </button>
            </div>

            <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">Name / Role</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Shift</th>
                    <th className="px-4 py-3 font-medium text-gray-700 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workers.filter(w => w.cellId === selectedCellId && (workerShiftFilter === "All" || w.shift === workerShiftFilter)).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No workers match criteria.</td></tr>}
                  {workers.filter(w => w.cellId === selectedCellId && (workerShiftFilter === "All" || w.shift === workerShiftFilter)).map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {editId === w.id ? (
                          <div className="flex flex-col gap-1">
                            <input 
                              autoFocus className="border border-gray-300 rounded px-2 py-1 text-sm w-full font-normal"
                              value={editName} onChange={e => setEditName(e.target.value)}
                            />
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm w-full" value={editRole} onChange={e => setEditRole(e.target.value)}>
                              <option value="Tailor">Tailor</option>
                              <option value="Quality Inspector">Quality Inspector</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{w.name}</span>
                            <span className="text-xs text-gray-500">{w.role}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editId === w.id ? (
                          <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white" value={editShift} onChange={e => setEditShift(e.target.value)}>
                            <option value="Group A">Group A</option>
                            <option value="Group B">Group B</option>
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100">{w.shift}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editId === w.id ? (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => handleUpdate(w.id, "Worker")}>Save</button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(w.id); setEditName(w.name); setEditRole(w.role); setEditShift(w.shift); }}>
                              <Edit2 size={16} />
                            </button>
                            <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(w.id, "Worker")}>
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
        </div>
      )}
    </div>
  );
}

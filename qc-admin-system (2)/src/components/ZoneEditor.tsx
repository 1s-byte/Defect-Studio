import React, { useState, useRef, useEffect } from "react";
import { Product, Zone, Operation, Worker, Point } from "../types";
import { api } from "../api";
import { ArrowLeft, Trash2, Upload, Target, Hexagon, PenTool, CheckCircle2, XCircle } from "lucide-react";

interface ZoneEditorProps {
  productId: string;
  onBack: () => void;
}

export function ZoneEditor({ productId, onBack }: ZoneEditorProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  
  const [drawMode, setDrawMode] = useState<"Point" | "Polygon" | "Curve">("Point");
  const [activePoints, setActivePoints] = useState<Point[]>([]);

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [allProducts, allOps, allWorkers] = await Promise.all([
        api.getProducts(),
        api.getOperations(),
        api.getWorkers(),
      ]);
      const activeProduct = allProducts.find(p => p.id === productId);
      setProduct(activeProduct || null);
      if (activeProduct) {
         setZones(activeProduct.zones || []);
      }
      setOperations(allOps.filter(o => o.productId === productId));
      if (activeProduct) {
        setWorkers(allWorkers.filter(w => w.cellId === activeProduct.cellId));
      }
      setLoading(false);
    };
    fetchData();
  }, [productId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        api.updateProduct(productId, { imageUrl: base64String }).then(updated => {
          setProduct(updated);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveZones = async (updatedZones: Zone[]) => {
    setZones(updatedZones);
    await api.updateProduct(productId, { zones: updatedZones });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (drawMode === "Point") {
      const newZone: Zone = {
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        type: "Point",
        label: `Zone ${zones.length + 1}`,
        operationId: null,
        assignmentA: null,
        assignmentB: null,
      };
      saveZones([...zones, newZone]);
    } else {
      setActivePoints([...activePoints, { x, y }]);
    }
  };

  const finishDrawing = () => {
    if (activePoints.length === 0) return;
    
    let centerX = 0;
    let centerY = 0;
    for (const p of activePoints) {
      centerX += p.x;
      centerY += p.y;
    }
    centerX /= activePoints.length;
    centerY /= activePoints.length;

    const newZone: Zone = {
      id: Math.random().toString(36).substr(2, 9),
      x: centerX,
      y: centerY,
      type: drawMode,
      points: activePoints,
      label: `Zone ${zones.length + 1}`,
      operationId: null,
      assignmentA: null,
      assignmentB: null,
    };
    saveZones([...zones, newZone]);
    setActivePoints([]);
  };

  const cancelDrawing = () => {
    setActivePoints([]);
  };

  const updateZone = (id: string, updates: Partial<Zone>) => {
    const updated = zones.map(z => z.id === id ? { ...z, ...updates } : z);
    saveZones(updated);
  };

  const deleteZone = (id: string) => {
    const updated = zones.filter(z => z.id !== id);
    saveZones(updated);
  };

  if (loading) return <div className="fixed inset-0 bg-white p-8 z-50 flex items-center justify-center">Loading Zone Editor...</div>;
  if (!product) return <div className="fixed inset-0 bg-white p-8 z-50">Product not found. <button onClick={onBack}>Back</button></div>;

  const workersGroupA = workers.filter(w => w.shift === "Group A");
  const workersGroupB = workers.filter(w => w.shift === "Group B");

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shrink-0 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Zone Editor</h2>
          <p className="text-sm text-gray-500">Product: {product.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Product Image Diagram</h3>
              
              <div className="flex items-center gap-2">
                {product.imageUrl && (
                  <div className="bg-gray-100 p-1 rounded-md flex gap-1 mr-4">
                    <button 
                      className={`px-3 py-1.5 text-sm font-medium rounded-sm flex items-center gap-1.5 ${drawMode === 'Point' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => { setDrawMode("Point"); cancelDrawing(); }}
                    >
                      <Target size={14} /> Point
                    </button>
                    <button 
                      className={`px-3 py-1.5 text-sm font-medium rounded-sm flex items-center gap-1.5 ${drawMode === 'Polygon' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => { setDrawMode("Polygon"); cancelDrawing(); }}
                    >
                      <Hexagon size={14} /> Polygon
                    </button>
                    <button 
                      className={`px-3 py-1.5 text-sm font-medium rounded-sm flex items-center gap-1.5 ${drawMode === 'Curve' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => { setDrawMode("Curve"); cancelDrawing(); }}
                    >
                      <PenTool size={14} /> Curve
                    </button>
                  </div>
                )}
                <label className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors">
                  <Upload size={16} />
                  {product.imageUrl ? "Change Image" : "Upload Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {product.imageUrl ? (
              <div className="space-y-4">
                {activePoints.length > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md border border-blue-100 animate-in fade-in">
                    <span className="text-sm text-blue-800 font-medium">
                      Drawing {drawMode}... {activePoints.length} points
                    </span>
                    <div className="flex gap-2">
                      <button onClick={cancelDrawing} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 bg-white border border-gray-200 rounded">
                        <XCircle size={14} /> Cancel
                      </button>
                      <button onClick={finishDrawing} className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 px-2 py-1 bg-white border border-blue-300 rounded shadow-sm">
                        <CheckCircle2 size={14} /> Finish Shape
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-100 inline-block w-full">
                  <img 
                    ref={imageRef}
                    src={product.imageUrl} 
                    alt="Product Diagram" 
                    onClick={handleImageClick}
                    className="w-full max-h-[600px] object-contain cursor-crosshair select-none"
                    draggable={false}
                  />
                  
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Render existing zones */}
                    {zones.map((zone) => {
                      if (zone.type === 'Polygon' && zone.points && zone.points.length > 0) {
                        return (
                          <polygon 
                            key={zone.id} 
                            points={zone.points.map(p => `${p.x},${p.y}`).join(' ')} 
                            fill="rgba(239, 68, 68, 0.2)" 
                            stroke="rgba(239, 68, 68, 0.8)" 
                            strokeWidth="2" 
                            vectorEffect="non-scaling-stroke" 
                          />
                        );
                      }
                      if (zone.type === 'Curve' && zone.points && zone.points.length > 0) {
                        return (
                          <polyline 
                            key={zone.id} 
                            points={zone.points.map(p => `${p.x},${p.y}`).join(' ')} 
                            fill="none" 
                            stroke="rgba(239, 68, 68, 0.8)" 
                            strokeWidth="3" 
                            vectorEffect="non-scaling-stroke" 
                          />
                        );
                      }
                      return null;
                    })}
                    
                    {/* Render active drawing */}
                    {activePoints.length > 0 && drawMode === 'Polygon' && (
                        <polygon 
                          points={activePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                          fill="rgba(59, 130, 246, 0.3)" 
                          stroke="rgba(59, 130, 246, 0.8)" 
                          strokeWidth="2" 
                          vectorEffect="non-scaling-stroke" 
                        />
                    )}
                    {activePoints.length > 0 && drawMode === 'Curve' && (
                        <polyline 
                          points={activePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                          fill="none" 
                          stroke="rgba(59, 130, 246, 0.8)" 
                          strokeWidth="3" 
                          vectorEffect="non-scaling-stroke" 
                        />
                    )}
                  </svg>

                  {/* Render points / labels */}
                  {zones.map((zone, idx) => (
                    <div 
                      key={zone.id}
                      className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white cursor-pointer hover:scale-110 transition-transform pointer-events-auto"
                      style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                      title={zone.label}
                    >
                      {idx + 1}
                    </div>
                  ))}

                  {/* Render active drawing point indicators */}
                  {activePoints.map((p, idx) => (
                    <div 
                      key={idx}
                      className="absolute w-2 h-2 -ml-1 -mt-1 bg-blue-600 rounded-full shadow pointer-events-none"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
                <Upload size={48} className="mb-4 text-gray-400" />
                <p>No image uploaded for this product.</p>
                <p className="text-sm">Upload a diagram to start adding zones.</p>
              </div>
            )}
          </div>

          {zones.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
               <h3 className="text-lg font-medium text-gray-800 mb-4">Configured Zones</h3>
               <div className="space-y-4">
                 {zones.map((zone, idx) => (
                   <div key={zone.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
                      <button 
                        onClick={() => deleteZone(zone.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                        title="Delete Zone"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        <input 
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-blue-500 w-full max-w-sm"
                          value={zone.label}
                          onChange={e => updateZone(zone.id, { label: e.target.value })}
                          placeholder="Zone Label (e.g. Collar)"
                        />
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                          {zone.type || 'Point'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Operation</label>
                          <select 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                            value={zone.operationId || ""}
                            onChange={e => updateZone(zone.id, { operationId: e.target.value || null })}
                          >
                            <option value="">Select Operation...</option>
                            {operations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Worker (Group A)</label>
                          <select 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                            value={zone.assignmentA || ""}
                            onChange={e => updateZone(zone.id, { assignmentA: e.target.value || null })}
                          >
                            <option value="">Unassigned...</option>
                            {workersGroupA.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Worker (Group B)</label>
                          <select 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                            value={zone.assignmentB || ""}
                            onChange={e => updateZone(zone.id, { assignmentB: e.target.value || null })}
                          >
                            <option value="">Unassigned...</option>
                            {workersGroupB.map(w => <option key={w.id} value={w.id}>{w.name} ({w.role})</option>)}
                          </select>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

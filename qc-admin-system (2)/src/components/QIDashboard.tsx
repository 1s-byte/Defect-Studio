import React, { useState, useEffect, useRef } from "react";
import { api, clearAuth } from "../api";
import { LogOut, ChevronRight, ClipboardList, CheckCircle2, AlertTriangle, PenTool } from "lucide-react";
import { Floor, Cell, Product, Worker, DefectCause } from "../types";

export function QIDashboard() {
  const [step, setStep] = useState<"setup" | "inspection" | "action">("setup");
  const [loading, setLoading] = useState(true);

  // Setup data
  const [floors, setFloors] = useState<Floor[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [defectCauses, setDefectCauses] = useState<DefectCause[]>([]);
  const [operations, setOperations] = useState<any[]>([]);

  // Form state
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedCell, setSelectedCell] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [jobQuantity, setJobQuantity] = useState("");
  const [shift, setShift] = useState<"Group A" | "Group B" | "">("");
  const [qiName, setQiName] = useState("");
  const [showQiSuggestions, setShowQiSuggestions] = useState(false);

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [defectQuantity, setDefectQuantity] = useState<number | "">(1);
  const [placedRMMarkers, setPlacedRMMarkers] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [f, c, p, w, d, o] = await Promise.all([
          api.getFloors(),
          api.getCells(),
          api.getProducts(),
          api.getWorkers(),
          api.getDefectCauses(),
          api.getOperations()
        ]);
        setFloors(f);
        setCells(c);
        setProducts(p);
        setWorkers(w);
        setDefectCauses(d);
        setOperations(o);

        const lastFloor = localStorage.getItem("qi_last_floor");
        const lastCell = localStorage.getItem("qi_last_cell");
        if (lastFloor && f.find(fl => fl.id === lastFloor)) setSelectedFloor(lastFloor);
        if (lastCell && c.find(ce => ce.id === lastCell)) setSelectedCell(lastCell);

      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    // Auto-populate QI Name based on cell and shift
    if (selectedCell && shift) {
      const defaultQi = workers.find(
        w => w.cellId === selectedCell && w.shift === shift && w.role === "Quality Inspector"
      );
      if (defaultQi) {
        setQiName(defaultQi.name);
      } else {
        setQiName("");
      }
    }
  }, [selectedCell, shift, workers]);

  const handleLogout = async () => {
    try { await api.logout(); } catch(e) {}
    clearAuth();
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloor || !selectedCell || !selectedProduct || !jobQuantity || !shift || !qiName) {
      alert("Please fill in all required fields.");
      return;
    }

    localStorage.setItem("qi_last_floor", selectedFloor);
    localStorage.setItem("qi_last_cell", selectedCell);

    setSessionInfo({
      floorId: selectedFloor,
      floorName: floors.find(f => f.id === selectedFloor)?.name,
      cellId: selectedCell,
      cellName: cells.find(c => c.id === selectedCell)?.name,
      product: products.find(p => p.id === selectedProduct),
      jobQuantity: parseInt(jobQuantity, 10),
      shift,
      qiName
    });

    setStep("inspection");
  };

  const recordDefect = async (extraFields: any) => {
    const record = {
      date: new Date().toISOString().split('T')[0],
      floorId: sessionInfo.floorId,
      cellId: sessionInfo.cellId,
      productId: sessionInfo.product.id,
      shift: sessionInfo.shift,
      defectCauseId: selectedDefectId,
      quantity: defectQuantity === "" ? 1 : defectQuantity,
      qiName: sessionInfo.qiName,
      ...extraFields
    };
    await api.createDefectRecord(record);
  };

  const handleRecordStitchingDefect = async (zone: any) => {
    const workerId = sessionInfo.shift === "Group A" ? zone.assignmentA : zone.assignmentB;
    const workerName = workers.find(w => w.id === workerId)?.name || "Unknown Worker";
    const operationName = operations.find(o => o.id === zone.operationId)?.name || "Unknown Operation";
    
    await recordDefect({ workerId, workerName, operationId: zone.operationId, operationName, markerX: null, markerY: null });
    alert(`Recorded ${defectQuantity === "" ? 1 : defectQuantity}x ${defectCauses.find(c => c.id === selectedDefectId)?.name} at Zone: ${zone.label}`);
    setStep("inspection");
    setSelectedDefectId(null);
    setDefectQuantity(1);
  };

  const handleRMMarkerClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    await recordDefect({ workerId: undefined, workerName: "RM", operationId: undefined, operationName: "RM", markerX: x, markerY: y });
    setPlacedRMMarkers(prev => [...prev, {x, y}]);
    alert(`Recorded ${defectQuantity === "" ? 1 : defectQuantity}x RM Defect.`);
    setStep("inspection");
    setSelectedDefectId(null);
    setDefectQuantity(1);
  };

  const filteredCells = cells.filter(c => c.floorId === selectedFloor);
  const filteredProducts = products.filter(p => p.cellId === selectedCell);
  
  const suggestedQIs = workers.filter(w => 
    w.role === "Quality Inspector" && 
    w.name.toLowerCase().includes(qiName.toLowerCase()) &&
    w.name !== qiName
  );

  const isRMDefect = defectCauses.find(c => c.id === selectedDefectId)?.type === "Raw Material";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {step === "setup" && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-2">
            <div className="flex justify-between items-center h-10">
              <div />
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Setup Mode
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] font-medium"
                >
                  <LogOut size={12} /> <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-1 sm:px-2 py-1 w-full flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">
            Loading system data...
          </div>
        ) : step === "setup" ? (
          <div className="max-w-3xl mx-auto w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible relative mt-8">
            <div className="bg-blue-600 px-6 py-5 rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardList size={24} /> Session Setup
              </h2>
              <p className="text-blue-100 mt-1 text-sm">Please verify your cell details and shift information before starting.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Floor */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                   <select 
                     required
                     className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                     value={selectedFloor}
                     onChange={e => { setSelectedFloor(e.target.value); setSelectedCell(""); setSelectedProduct(""); }}
                   >
                     <option value="">Select Floor...</option>
                     {floors.map(f => (
                       <option key={f.id} value={f.id}>{f.name}</option>
                     ))}
                   </select>
                 </div>

                 {/* Cell */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Assembly Cell</label>
                   <select 
                     required
                     disabled={!selectedFloor}
                     className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                     value={selectedCell}
                     onChange={e => { setSelectedCell(e.target.value); setSelectedProduct(""); }}
                   >
                     <option value="">Select Cell...</option>
                     {filteredCells.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                 </div>

                 {/* Product */}
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                   <select 
                     required
                     disabled={!selectedCell}
                     className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                     value={selectedProduct}
                     onChange={e => setSelectedProduct(e.target.value)}
                   >
                     <option value="">Select Product...</option>
                     {filteredProducts.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                 </div>

                 {/* Job Quantity */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Job Quantity</label>
                   <input 
                     type="number"
                     required
                     min="1"
                     placeholder="e.g. 500"
                     className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                     value={jobQuantity}
                     onChange={e => setJobQuantity(e.target.value)}
                   />
                 </div>

                 {/* Shift */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:text-blue-700 transition-colors">
                       <input 
                         type="radio" 
                         name="shift" 
                         value="Group A" 
                         required
                         checked={shift === "Group A"}
                         onChange={e => setShift("Group A")}
                         className="w-4 h-4 text-blue-600"
                       />
                       <span className="font-medium text-base">Group A</span>
                     </label>
                     <label className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:text-blue-700 transition-colors">
                       <input 
                         type="radio" 
                         name="shift" 
                         value="Group B" 
                         required
                         checked={shift === "Group B"}
                         onChange={e => setShift("Group B")}
                         className="w-4 h-4 text-blue-600"
                       />
                       <span className="font-medium text-base">Group B</span>
                     </label>
                   </div>
                 </div>

                 {/* QI Name with Autocomplete */}
                 <div className="md:col-span-2 relative">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Quality Inspector Name</label>
                   <input 
                     type="text"
                     required
                     placeholder="Type inspector name..."
                     disabled={!selectedCell || !shift}
                     className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                     value={qiName}
                     onChange={e => { setQiName(e.target.value); setShowQiSuggestions(true); }}
                     onFocus={() => setShowQiSuggestions(true)}
                     onBlur={() => setTimeout(() => setShowQiSuggestions(false), 200)}
                   />
                   {showQiSuggestions && suggestedQIs.length > 0 && qiName.length > 0 && (
                     <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                       {suggestedQIs.map(qi => (
                         <div 
                           key={qi.id}
                           className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                           onClick={() => { setQiName(qi.name); setShowQiSuggestions(false); }}
                         >
                           <div className="font-medium text-gray-900">{qi.name}</div>
                           <div className="text-xs text-gray-500">Quality Inspector · {qi.shift}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

           <div className="pt-4 border-t border-gray-100">
                 <button 
                   type="submit"
                   className="w-full bg-blue-600 text-white font-bold text-lg rounded-xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md"
                 >
                   Start Inspection <ChevronRight size={24} />
                 </button>
               </div>
            </form>
          </div>
        ) : step === "inspection" ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             <div className="bg-white border text-[11px] border-blue-200 bg-blue-50 rounded p-1.5 mb-1.5 flex-shrink-0 shadow-sm flex flex-wrap gap-x-3 gap-y-0.5 items-center justify-between">
               <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                 <div className="font-medium text-blue-900"><span className="text-blue-700 font-normal">Cell:</span> {sessionInfo?.cellName}</div>
                 <div className="font-medium text-blue-900"><span className="text-blue-700 font-normal">Product:</span> {sessionInfo?.product?.name}</div>
                 <div className="font-medium text-blue-900"><span className="text-blue-700 font-normal">Qty:</span> {sessionInfo?.jobQuantity}</div>
                 <div className="font-medium text-blue-900"><span className="text-blue-700 font-normal">Shift:</span> {sessionInfo?.shift}</div>
                 <button 
                   onClick={() => setStep("setup")}
                   className="text-blue-600 hover:text-blue-800 underline text-[11px] font-medium ml-2"
                 >
                   Change Setup
                 </button>
               </div>
               <div className="flex items-center gap-3 border-l border-blue-200 pl-3">
                 <span className="text-[10px] font-medium text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                   {sessionInfo?.qiName}
                 </span>
                 <button 
                   onClick={handleLogout}
                   className="text-blue-600 hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] font-medium"
                 >
                   <LogOut size={12} /> <span className="hidden sm:inline">Logout</span>
                 </button>
               </div>
             </div>

             <div className="flex flex-col flex-1 overflow-hidden">
               <div className="flex-1 overflow-y-auto pr-1 pb-1">
                 
                 <div className="mb-2">
                   <h3 className="text-[11px] font-semibold text-orange-800 flex items-center gap-1 mb-1 bg-orange-50 p-1 rounded border border-orange-100 uppercase tracking-wider">
                     <AlertTriangle size={12} /> STITCHING DEFECTS
                   </h3>
                   <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-1">
                     {defectCauses.filter(c => c.type === "In-Cell Process").map(cause => (
                       <button
                         key={cause.id}
                         onClick={() => {
                           setSelectedDefectId(cause.id);
                           setStep("action");
                         }}
                         className="bg-white border border-orange-200 hover:border-orange-500 hover:bg-orange-50 text-gray-800 rounded flex flex-col justify-center items-center text-center shadow-sm transition-all active:scale-95 p-0.5 min-h-[32px]"
                       >
                         <span className="font-bold text-[9px] leading-[1.1]">{cause.name}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="pb-1">
                   <h3 className="text-[11px] font-semibold text-pink-800 flex items-center gap-1 mb-1 bg-pink-50 p-1 rounded border border-pink-100 uppercase tracking-wider">
                     <PenTool size={12} /> RM DEFECTS
                   </h3>
                   <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-1">
                     {defectCauses.filter(c => c.type === "Raw Material").map(cause => (
                       <button
                         key={cause.id}
                         onClick={() => {
                           setSelectedDefectId(cause.id);
                           setStep("action");
                         }}
                         className="bg-white border border-pink-200 hover:border-pink-500 hover:bg-pink-50 text-gray-800 rounded flex flex-col justify-center items-center text-center shadow-sm transition-all active:scale-95 p-0.5 min-h-[32px]"
                       >
                         <span className="font-bold text-[9px] leading-[1.1]">{cause.name}</span>
                       </button>
                     ))}
                   </div>
                 </div>

               </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
             <div className="bg-red-50 border-b border-red-100 p-3 flex justify-between items-center shrink-0 flex-wrap gap-2">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => { setStep("inspection"); setSelectedDefectId(null); setDefectQuantity(1); }}
                   className="text-gray-500 hover:bg-gray-200 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium transition-colors"
                 >
                   Back
                 </button>
                 <div>
                   <div className="text-xs text-red-800 font-semibold uppercase">Selected Defect</div>
                   <div className="text-sm font-bold text-gray-900">{defectCauses.find(c => c.id === selectedDefectId)?.name}</div>
                 </div>
               </div>
               
               <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-red-200 shadow-sm flex-wrap">
                 <div className="flex items-center text-gray-600 bg-gray-50 rounded border border-gray-200 px-2.5 py-1">
                   <span className="text-sm font-bold mr-1">+</span>
                   <input
                     type="number"
                     min="1"
                     value={defectQuantity}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === "") {
                         setDefectQuantity("");
                       } else {
                         const parsed = parseInt(val, 10);
                         if (!isNaN(parsed) && parsed > 0) setDefectQuantity(parsed);
                       }
                     }}
                     onBlur={() => {
                       if (defectQuantity === "") setDefectQuantity(1);
                     }}
                     className="w-10 text-center bg-transparent outline-none text-sm font-bold text-gray-800"
                   />
                 </div>
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button
                     key={num}
                     onClick={() => setDefectQuantity(num)}
                     className={`w-8 h-8 rounded text-sm font-bold transition-colors flex items-center justify-center
                       ${defectQuantity === num 
                         ? 'bg-red-600 text-white shadow-md' 
                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                   >
                     +{num}
                   </button>
                 ))}
               </div>
             </div>
             
             <div className="flex-1 p-4 bg-gray-100 overflow-auto flex justify-center items-start shrink-0 relative">
               {sessionInfo?.product?.imageUrl ? (
                 <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white inline-block shadow-sm">
                   <img 
                     src={sessionInfo.product.imageUrl} 
                     alt="Product Diagram" 
                     className={`max-h-[65vh] w-auto object-contain select-none shadow-sm ${isRMDefect ? 'cursor-crosshair' : ''}`}
                     draggable={false}
                     onClick={isRMDefect ? handleRMMarkerClick : undefined}
                   />
                   
                   {!isRMDefect && (
                     <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                       {(sessionInfo.product.zones || []).map((zone: any) => {
                         if (zone.type === 'Polygon' && zone.points && zone.points.length > 0) {
                           return (
                             <polygon 
                               key={zone.id} 
                               points={zone.points.map((p: any) => `${p.x},${p.y}`).join(' ')} 
                               fill="rgba(59, 130, 246, 0.2)" 
                               stroke="rgba(59, 130, 246, 0.8)" 
                               strokeWidth="2" 
                               vectorEffect="non-scaling-stroke"
                               className="pointer-events-auto cursor-pointer hover:fill-blue-500/40 hover:stroke-blue-600 transition-all"
                               onClick={() => handleRecordStitchingDefect(zone)}
                             />
                           );
                         }
                         if (zone.type === 'Curve' && zone.points && zone.points.length > 0) {
                           return (
                             <polyline 
                               key={zone.id} 
                               points={zone.points.map((p: any) => `${p.x},${p.y}`).join(' ')} 
                               fill="none" 
                               stroke="rgba(59, 130, 246, 0.8)" 
                               strokeWidth="4" 
                               vectorEffect="non-scaling-stroke"
                               className="pointer-events-auto cursor-pointer hover:stroke-blue-600 transition-all"
                               onClick={() => handleRecordStitchingDefect(zone)}
                             />
                           );
                         }
                         return null;
                       })}
                     </svg>
                   )}

                   {!isRMDefect && (sessionInfo.product.zones || []).map((zone: any, idx: number) => (
                     <button 
                       key={zone.id}
                       className="absolute w-8 h-8 -ml-4 -mt-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white hover:scale-110 active:scale-95 transition-transform pointer-events-auto focus:outline-none focus:ring-blue-400"
                       style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                       title={zone.label}
                       onClick={() => handleRecordStitchingDefect(zone)}
                     >
                       {idx + 1}
                     </button>
                   ))}

                   {isRMDefect && placedRMMarkers.map((marker, idx) => (
                     <div 
                       key={idx}
                       className="absolute w-3 h-3 -ml-1.5 -mt-1.5 bg-red-600 rounded-full pointer-events-none shadow-sm ring-1 ring-white"
                       style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="text-gray-500 bg-white p-8 rounded-lg shadow-sm w-full max-w-md text-center mt-12 border border-gray-200">
                   <AlertTriangle className="mx-auto mb-4 text-orange-400" size={48} />
                   <h3 className="text-lg font-bold text-gray-800 mb-2">No Diagram Available</h3>
                   <p className="text-sm">The administration team has not uploaded an image diagram or configured zones for this product.</p>
                   <p className="text-xs bg-gray-50 border-t border-gray-100 p-2 mt-4 text-left">
                     <b>Selected Defect:</b> {defectCauses.find(c => c.id === selectedDefectId)?.name}
                   </p>
                 </div>
               )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

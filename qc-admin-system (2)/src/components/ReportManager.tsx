import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Floor, Cell, Product, DefectCause } from "../types";
import { Download, Filter, FileSpreadsheet, ImageIcon } from "lucide-react";

export function ReportManager() {
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [defectCauses, setDefectCauses] = useState<DefectCause[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedCell, setSelectedCell] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedRmDefect, setSelectedRmDefect] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [f, c, p, d, r] = await Promise.all([
          api.getFloors(),
          api.getCells(),
          api.getProducts(),
          api.getDefectCauses(),
          api.getDefectRecords()
        ]);
        setFloors(f);
        setCells(c);
        setProducts(p);
        setDefectCauses(d);
        setRecords(r);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredCells = cells.filter(c => c.floorId === selectedFloor);
  const filteredProducts = products.filter(p => p.cellId === selectedCell);
  const rmDefects = defectCauses.filter(d => d.type === "Raw Material");

  const filteredRecords = records.filter(r => {
    if (r.date < startDate || r.date > endDate) return false;
    if (selectedFloor && r.floorId !== selectedFloor) return false;
    if (selectedCell && r.cellId !== selectedCell) return false;
    if (selectedProduct && r.productId !== selectedProduct) return false;
    if (selectedShift && r.shift !== selectedShift) return false;
    if (selectedRmDefect && r.defectCauseId !== selectedRmDefect) return false;
    return true;
  });

  const handleDownloadExcel = () => {
    const headers = ["Date", "Timestamp", "Floor", "Cell", "Product", "Shift", "Defect Cause", "Worker", "Operation", "Defective Quantity"];
    const rows = filteredRecords.map(r => {
      const cause = defectCauses.find(c => c.id === r.defectCauseId)?.name || "Unknown";
      const product = products.find(p => p.id === r.productId)?.name || "Unknown";
      const cell = cells.find(c => c.id === r.cellId)?.name || "Unknown";
      const floor = floors.find(f => f.id === r.floorId)?.name || "Unknown";
      const dt = new Date(r.timestamp).toLocaleString();
      return `"${r.date}","${dt}","${floor}","${cell}","${product}","${r.shift}","${cause}","${r.workerName}","${r.operationName}","${r.quantity}"`;
    });

    const csvData = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Defective_Report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedProductObj = products.find(p => p.id === selectedProduct);
  const rmRecords = filteredRecords.filter(r => r.markerX != null && r.markerY != null);

  const handleDownloadImage = () => {
    if (!selectedProductObj?.imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      
      // Draw dots
      rmRecords.forEach(marker => {
        if (marker.markerX != null && marker.markerY != null) {
          const x = (marker.markerX / 100) * canvas.width;
          const y = (marker.markerY / 100) * canvas.height;
          const radius = Math.max(canvas.width * 0.005, 5); // scale dot to image size
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = 'rgba(220, 38, 38, 0.8)'; // red-600 with 80% opacity
          ctx.fill();
        }
      });
      
      const link = document.createElement("a");
      link.download = `RM_Defect_Diagram_${selectedProductObj.name}_${startDate}_to_${endDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = selectedProductObj.imageUrl;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Defective Reports</h2>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Filter size={20} /> Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select value={selectedFloor} onChange={e => { setSelectedFloor(e.target.value); setSelectedCell(""); setSelectedProduct(""); }} className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Floors</option>
              {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cell</label>
            <select value={selectedCell} onChange={e => { setSelectedCell(e.target.value); setSelectedProduct(""); }} disabled={!selectedFloor} className="w-full border border-gray-300 rounded px-3 py-2 outline-none disabled:bg-gray-100 disabled:text-gray-400">
              <option value="">All Cells</option>
              {filteredCells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} disabled={!selectedCell} className="w-full border border-gray-300 rounded px-3 py-2 outline-none disabled:bg-gray-100 disabled:text-gray-400">
              <option value="">All Products</option>
              {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift (Optional)</label>
            <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none">
              <option value="">All Shifts</option>
              <option value="Group A">Group A</option>
              <option value="Group B">Group B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RM Defect (Optional filter)</label>
            <select value={selectedRmDefect} onChange={e => setSelectedRmDefect(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 outline-none">
              <option value="">All Defects</option>
              {rmDefects.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 shadow-sm transition-colors"
          >
            <FileSpreadsheet size={18} /> Download Excel Report ({filteredRecords.length} records)
          </button>
          
          {selectedProductObj && selectedProductObj.imageUrl && rmRecords.length > 0 && (
            <button 
              onClick={handleDownloadImage}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Download size={18} /> Download Diagram Image
            </button>
          )}
        </div>
      </div>

      {selectedProductObj && selectedProductObj.imageUrl && rmRecords.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <ImageIcon size={20} /> RM Defect Diagram ({rmRecords.length} markers)
          </h3>
          <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white inline-block shadow-sm">
            <img 
              src={selectedProductObj.imageUrl} 
              alt="Product Diagram" 
              className="max-h-[600px] w-auto object-contain select-none"
              draggable={false}
            />
            {rmRecords.map((marker, idx) => (
              <div 
                key={marker.id + idx}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 bg-red-600 rounded-full opacity-80"
                style={{ left: `${marker.markerX}%`, top: `${marker.markerY}%` }}
                title={`${marker.quantity}x ${defectCauses.find(c => c.id === marker.defectCauseId)?.name} at ${new Date(marker.timestamp).toLocaleString()}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

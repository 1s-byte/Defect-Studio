import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// In-memory data store for PoC
let floors = [
  { id: "1", name: "1 Tynor-169" },
  { id: "2", name: "2 Ortech" },
];

let cells = [
  { id: "1", name: "Cell A", floorId: "1" },
  { id: "2", name: "Cell B", floorId: "1" },
  { id: "3", name: "Cell C", floorId: "2" },
];

let products = [
  { id: "1", name: "Product Alpha", cellId: "1" },
  { id: "2", name: "Product Beta", cellId: "1" },
  { id: "3", name: "Product Gamma", cellId: "2" },
];

let operations = [
  { id: "1", name: "Cutting", productId: "1" },
  { id: "2", name: "Stitching", productId: "1" },
  { id: "3", name: "Quality Check", productId: "1" },
];

let workers: any[] = [
  { id: "1", name: "John Doe", role: "Tailor", shift: "Group A", cellId: "1" },
  { id: "2", name: "Jane Smith", role: "Quality Inspector", shift: "Group A", cellId: "1" },
  { id: "3", name: "Bob Johnson", role: "Tailor", shift: "Group B", cellId: "2" },
  { id: "4", name: "Alice Brown", role: "Tailor", shift: "Group A", cellId: "3" },
  { id: "5", name: "Charlie Davis", role: "Quality Inspector", shift: "Group B", cellId: "2" },
];

const hashPassword = (password: string) => crypto.createHash("sha256").update(password || "").digest("hex");

let users: any[] = [
  { id: "1", username: "Admin", passwordHash: hashPassword("TY##27ty"), role: "Admin" },
  { id: "2", username: "QI", passwordHash: hashPassword("QC$$27qc"), role: "QI" }
];

let sessions: Record<string, any> = {};

// Default Defect Causes
const defaultInCell = [
  "Trim Placement Out/Missing", "Taffeta Label Out/Missing", "HT/Print Placement Out",
  "In-Process Fabric/Trim Damage", "Needle Hole", "Raw Edge Visible", "Measurement Out of Tolerance",
  "Margin Uneven", "Pleats Due to Stitching", "Puckering", "Wavy Seam", "Dirty In Process",
  "Piping Rundown Stitch", "Thread Tension", "Bartack Improper", "Skip Stitch", "SP2I Improper",
  "Open Seam", "Improper Backtack <10mm", "Double Stitch", "Run Down Stitch", "Broken Stitch",
  "Uncut Thread >5mm"
];

const defaultRawMaterial = [
  "Defective Trim", "Fabric Defect", "RM Stains", "Product/Panel Shape Out",
  "Weight Out of Tolerance", "Cutting Improper", "RF Sealing/Laser Cut Improper",
  "Glueing Improper", "Velcro Ultra Sonic Improper"
];

let defectCauses: any[] = [
  ...defaultInCell.map((name, i) => ({ id: `incell-${i}`, name, type: 'In-Cell Process' })),
  ...defaultRawMaterial.map((name, i) => ({ id: `rm-${i}`, name, type: 'Raw Material' }))
];

// Generate ID helper
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Auth ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const hash = hashPassword(password);
  const user = users.find(u => u.username === username && u.passwordHash === hash);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions[token] = { id: user.id, username: user.username, role: user.role };
    res.json({ token, role: user.role, username: user.username });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token && sessions[token]) delete sessions[token];
  res.json({ success: true });
});

app.use("/api", (req, res, next) => {
  if (req.path === "/login" || req.path === "/logout") return next();
  const token = req.headers.authorization?.split(" ")[1];
  if (token && sessions[token]) {
    (req as any).user = sessions[token];
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
});

// --- Users ---
app.get("/api/users", (req, res) => {
  if ((req as any).user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
  res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});
app.post("/api/users", (req, res) => {
  if ((req as any).user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
  const { username, password, role } = req.body;
  const user = { id: generateId(), username, passwordHash: hashPassword(password), role };
  users.push(user);
  res.json({ id: user.id, username: user.username, role: user.role });
});
app.put("/api/users/:id", (req, res) => {
  if ((req as any).user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
  const { username, password, role } = req.body;
  users = users.map(u => {
    if (u.id === req.params.id) {
       return { ...u, username: username || u.username, role: role || u.role, passwordHash: password ? hashPassword(password) : u.passwordHash };
    }
    return u;
  });
  res.json({ success: true });
});
app.delete("/api/users/:id", (req, res) => {
  if ((req as any).user.role !== "Admin") return res.status(403).json({ error: "Forbidden" });
  users = users.filter(u => u.id !== req.params.id);
  res.json({ success: true });
});

// --- Defect Causes ---
app.get("/api/defect-causes", (req, res) => res.json(defectCauses));
app.post("/api/defect-causes", (req, res) => {
  const { name, type } = req.body;
  const dc = { id: generateId(), name, type };
  defectCauses.push(dc);
  res.json(dc);
});
app.put("/api/defect-causes/:id", (req, res) => {
  const { name, type } = req.body;
  defectCauses = defectCauses.map(d => d.id === req.params.id ? { ...d, name, type } : d);
  res.json({ success: true });
});
app.delete("/api/defect-causes/:id", (req, res) => {
  defectCauses = defectCauses.filter(d => d.id !== req.params.id);
  res.json({ success: true });
});

// --- Floors ---
app.get("/api/floors", (req, res) => res.json(floors));
app.post("/api/floors", (req, res) => {
  const floor = { id: generateId(), ...req.body };
  floors.push(floor);
  res.json(floor);
});
app.put("/api/floors/:id", (req, res) => {
  floors = floors.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  res.json(floors.find(b => b.id === req.params.id) || null);
});
app.delete("/api/floors/:id", (req, res) => {
  floors = floors.filter(b => b.id !== req.params.id);
  // cleanup cells?
  cells = cells.filter(c => c.floorId !== req.params.id);
  res.json({ success: true });
});

// --- Cells ---
app.get("/api/cells", (req, res) => res.json(cells));
app.post("/api/cells", (req, res) => {
  const cell = { id: generateId(), ...req.body };
  cells.push(cell);
  res.json(cell);
});
app.put("/api/cells/:id", (req, res) => {
  cells = cells.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  res.json(cells.find(b => b.id === req.params.id) || null);
});
app.delete("/api/cells/:id", (req, res) => {
  cells = cells.filter(b => b.id !== req.params.id);
  products = products.filter(p => p.cellId !== req.params.id);
  workers = workers.map(w => w.cellId === req.params.id ? { ...w, cellId: null } : w);
  res.json({ success: true });
});

// --- Products ---
app.get("/api/products", (req, res) => res.json(products));
app.post("/api/products", (req, res) => {
  const product = { id: generateId(), ...req.body };
  products.push(product);
  res.json(product);
});
app.put("/api/products/:id", (req, res) => {
  products = products.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  res.json(products.find(b => b.id === req.params.id) || null);
});
app.delete("/api/products/:id", (req, res) => {
  products = products.filter(b => b.id !== req.params.id);
  operations = operations.filter(o => o.productId !== req.params.id);
  res.json({ success: true });
});

// --- Operations ---
app.get("/api/operations", (req, res) => res.json(operations));
app.post("/api/operations", (req, res) => {
  const op = { id: generateId(), ...req.body };
  operations.push(op);
  res.json(op);
});
app.put("/api/operations/:id", (req, res) => {
  operations = operations.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  res.json(operations.find(b => b.id === req.params.id) || null);
});
app.delete("/api/operations/:id", (req, res) => {
  operations = operations.filter(b => b.id !== req.params.id);
  res.json({ success: true });
});

// --- Workers ---
app.get("/api/workers", (req, res) => res.json(workers));
app.post("/api/workers", (req, res) => {
  const worker = { id: generateId(), ...req.body };
  workers.push(worker);
  res.json(worker);
});
app.put("/api/workers/:id", (req, res) => {
  workers = workers.map(b => b.id === req.params.id ? { ...b, ...req.body } : b);
  res.json(workers.find(b => b.id === req.params.id) || null);
});
app.delete("/api/workers/:id", (req, res) => {
  workers = workers.filter(b => b.id !== req.params.id);
  res.json({ success: true });
});

// --- Bulk Update Workers ---
app.put("/api/workers-bulk", (req, res) => {
  const { workerIds, overrides } = req.body;
  if (!Array.isArray(workerIds)) {
    return res.status(400).json({ error: "workerIds must be an array" });
  }

  workers = workers.map(w => {
    if (workerIds.includes(w.id)) {
      return { ...w, ...overrides };
    }
    return w;
  });

  res.json({ success: true });
});

let defectRecords: any[] = [];

// --- Defect Records ---
app.get("/api/defect-records", (req, res) => res.json(defectRecords));
app.post("/api/defect-records", (req, res) => {
  const record = { id: generateId(), timestamp: Date.now(), ...req.body };
  defectRecords.push(record);
  res.json(record);
});

// --- Export ---
app.get("/api/export", (req, res) => {
  res.json({ floors, cells, products, operations, workers });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

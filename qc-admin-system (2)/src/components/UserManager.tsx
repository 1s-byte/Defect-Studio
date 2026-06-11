import React, { useState, useEffect } from "react";
import { api } from "../api";
import { AppUser } from "../types";
import { Trash2, Plus, Edit2, ShieldAlert } from "lucide-react";

export function UserManager() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"Admin" | "QI">("QI");

  const [editId, setEditId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"Admin" | "QI">("QI");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!createUsername || !createPassword || !createRole) return;
    await api.createUser({ username: createUsername, password: createPassword, role: createRole });
    setCreateUsername("");
    setCreatePassword("");
    setCreateRole("QI");
    loadData();
  };

  const handleUpdate = async (id: string) => {
    if (!editUsername || !editRole) return;
    await api.updateUser(id, { username: editUsername, role: editRole, ...(editPassword ? { password: editPassword } : {}) });
    setEditId(null);
    setEditPassword("");
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete user?")) return;
    await api.deleteUser(id);
    loadData();
  };

  if (loading) return <div className="p-4 text-gray-500 font-mono text-sm">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border text-sm border-gray-200 rounded-md p-4 space-y-4 shadow-sm">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <ShieldAlert size={16} /> Add New User
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none flex-1 min-w-[200px]" placeholder="Username" value={createUsername} onChange={e => setCreateUsername(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none flex-1 min-w-[200px]" type="password" placeholder="Password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} />
          <select className="border border-gray-300 rounded px-3 py-1.5 bg-white flex-1 min-w-[150px]" value={createRole} onChange={e => setCreateRole(e.target.value as any)}>
            <option value="QI">QI</option>
            <option value="Admin">Admin</option>
          </select>
          <button className="bg-gray-900 text-white px-4 py-1.5 rounded font-medium hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap" onClick={handleCreate}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white border text-sm border-gray-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="py-2 px-4 font-medium">Username</th>
              <th className="py-2 px-4 font-medium">Role</th>
              <th className="py-2 px-4 font-medium">Password</th>
              <th className="py-2 px-4 font-medium w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 whitespace-nowrap">
                  {editId === u.id ? (
                     <input className="border border-gray-300 rounded px-2 py-1 w-full max-w-[200px]" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                  ) : u.username}
                </td>
                <td className="py-2 px-4 whitespace-nowrap">
                  {editId === u.id ? (
                     <select className="border border-gray-300 rounded px-2 py-1 bg-white" value={editRole} onChange={e => setEditRole(e.target.value as any)}>
                        <option value="QI">QI</option>
                        <option value="Admin">Admin</option>
                     </select>
                  ) : (
                     <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                     </span>
                  )}
                </td>
                <td className="py-2 px-4 whitespace-nowrap">
                  {editId === u.id ? (
                     <input className="border border-gray-300 rounded px-2 py-1 w-full max-w-[200px]" type="password" placeholder="New Password (leave blank to keep)" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                  ) : <span className="text-gray-400">********</span>}
                </td>
                <td className="py-2 px-4 text-right">
                  {editId === u.id ? (
                    <div className="flex justify-end gap-2">
                       <button className="text-gray-500 hover:text-gray-700 text-xs font-medium" onClick={() => { setEditId(null); setEditPassword(""); }}>Cancel</button>
                       <button className="text-blue-600 hover:text-blue-800 text-xs font-medium" onClick={() => handleUpdate(u.id)}>Save</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button className="text-gray-400 hover:text-gray-900" onClick={() => { setEditId(u.id); setEditUsername(u.username); setEditRole(u.role); setEditPassword(""); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">No users configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

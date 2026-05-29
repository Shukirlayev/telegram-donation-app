import { UserProfile } from "../types";
import { User, Edit2, Check, X } from "lucide-react";
import { useState } from "react";

interface ProfileProps {
  profile: UserProfile | null;
  token: string | null;
  onRefresh: () => void;
}

export default function Profile({ profile, token, onRefresh }: ProfileProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!token || !editNameValue.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: editNameValue.trim() })
      });
      if (res.ok) {
        setIsEditingName(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="font-bold text-slate-800 text-lg">Profil Sozlamalari</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
        {profile?.telegramPhotoUrl ? (
          <img src={profile.telegramPhotoUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-blue-50 object-cover shadow-sm mb-4" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100 shadow-sm mb-4">
            <User className="w-10 h-10 text-blue-300" />
          </div>
        )}

        <div className="w-full">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ism (Display Name)</label>
          {isEditingName ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Ismingiz..."
              />
              <button 
                onClick={handleSaveName} 
                disabled={savingName || !editNameValue.trim()} 
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setIsEditingName(false);
                  setEditNameValue(profile?.displayName || "");
                }} 
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-800">{profile?.displayName || profile?.telegramFirstName || "Foydalanuvchi"}</span>
              <button 
                onClick={() => { setIsEditingName(true); setEditNameValue(profile?.displayName || ""); }}
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {profile?.telegramUsername && (
          <div className="w-full mt-4">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Telegram Username</label>
            <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">@{profile.telegramUsername}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

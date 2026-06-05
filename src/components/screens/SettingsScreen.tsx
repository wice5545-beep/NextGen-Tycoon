// ============================================================================
//  Settings — save/load (local + cloud), auth, export, reset.
// ============================================================================
"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/store/gameStore";
import { GlassCard, SectionTitle, Button, Badge } from "@/components/ui";
import { isCloudEnabled } from "@/lib/supabase";
import {
  cloudSave,
  cloudLoad,
  cloudList,
  signInWithEmail,
  signOut,
  currentUserEmail,
  type CloudSaveMeta,
} from "@/lib/cloudSave";
import { fmtDate } from "@/lib/format";

export function SettingsScreen() {
  const s = useGame((st) => st.state)!;
  const saveLocal = useGame((st) => st.saveLocal);
  const setState = useGame((st) => st.setState);
  const loadFromJSON = useGame((st) => st.loadFromJSON);

  const cloud = isCloudEnabled();
  const [email, setEmail] = useState("");
  const [signedEmail, setSignedEmail] = useState<string | null>(null);
  const [saves, setSaves] = useState<CloudSaveMeta[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!cloud) return;
    currentUserEmail().then(setSignedEmail);
  }, [cloud]);

  async function refreshSaves() {
    setSaves(await cloudList());
  }

  function exportSave() {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextgen-tycoon-${s.clock.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSave(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (loadFromJSON(String(reader.result))) setMsg("Sauvegarde importée ✓");
      else setMsg("Fichier invalide ✗");
    };
    reader.readAsText(file);
  }

  function resetGame() {
    if (confirm("Réinitialiser la partie ? Cette action est irréversible.")) {
      localStorage.removeItem("ngt_save_v1");
      location.reload();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GlassCard>
        <SectionTitle right={<Badge tone="brand">seed #{s.meta.seed.toString(16)}</Badge>}>
          Sauvegarde locale
        </SectionTitle>
        <p className="mb-3 text-sm text-ink-300">
          Partie : <span className="font-medium">{s.company.name}</span> · {fmtDate(s.clock.year, s.clock.month)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { saveLocal(); setMsg("Sauvegardé localement ✓"); }}>💾 Sauvegarder</Button>
          <Button variant="outline" onClick={exportSave}>⬇️ Exporter (.json)</Button>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-line px-4 py-2 text-sm hover:bg-white/5">
            ⬆️ Importer
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importSave(e.target.files[0])}
            />
          </label>
          <Button variant="danger" onClick={resetGame}>🗑️ Réinitialiser</Button>
        </div>
        {msg && <p className="mt-3 text-xs text-good">{msg}</p>}
      </GlassCard>

      <GlassCard delay={0.05}>
        <SectionTitle right={<Badge tone={cloud ? "good" : "neutral"}>{cloud ? "Activé" : "Hors-ligne"}</Badge>}>
          Sauvegarde Cloud (Supabase)
        </SectionTitle>
        {!cloud ? (
          <p className="text-sm text-ink-500">
            Configure <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
            <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans{" "}
            <code className="rounded bg-white/10 px-1">.env.local</code> pour activer le cloud, l'auth et la sync multi-appareils.
          </p>
        ) : signedEmail ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-300">Connecté : <span className="font-medium">{signedEmail}</span></p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={async () => { const v = await cloudSave(s, 0, "manuel"); setMsg(v ? `Cloud v${v} ✓` : "Échec cloud"); refreshSaves(); }}>
                ☁️ Sauver au cloud
              </Button>
              <Button variant="outline" onClick={async () => { const st2 = await cloudLoad(0); if (st2) { setState(st2); setMsg("Chargé du cloud ✓"); } }}>
                ⏬ Charger
              </Button>
              <Button variant="outline" onClick={refreshSaves}>↻ Versions</Button>
              <Button variant="ghost" onClick={async () => { await signOut(); setSignedEmail(null); }}>Déconnexion</Button>
            </div>
            {saves.length > 0 && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {saves.map((v) => (
                  <div key={v.id} className="flex justify-between rounded-lg bg-white/5 px-2 py-1 text-[11px]">
                    <span>v{v.version} · {v.label ?? "—"}</span>
                    <span className="text-ink-500">an {v.game_year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="flex-1 rounded-xl border border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <Button onClick={async () => { const ok = await signInWithEmail(email); setMsg(ok ? "Lien magique envoyé ✉️" : "Échec"); }}>
              Connexion
            </Button>
          </div>
        )}
        {msg && <p className="mt-3 text-xs text-cyan">{msg}</p>}
      </GlassCard>
    </div>
  );
}

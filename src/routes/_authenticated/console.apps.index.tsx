import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShieldCheck, Zap, Copy } from "lucide-react";
import { toast } from "sonner";
import { ConsolePage } from "@/components/console/ConsolePage";
import { APPS_KEY, errorText, useConsoleApps, type ConsoleApp } from "@/components/console/console-data";
import { AppLogo } from "@/components/console/AppLogo";
import { deleteOAuthClient, saveOAuthClient } from "@/lib/oauth/console.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/console/apps/")({
  component: AppsOverview,
});

function AppsOverview() {
  const { data, isLoading, error } = useConsoleApps();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<ConsoleApp | null>(null);
  const remove = useServerFn(deleteOAuthClient);
  const qc = useQueryClient();

  return (
    <ConsolePage
      title="Je apps"
      description="Alle apps die 'Login met ROUT' gebruiken."
      actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nieuwe app</Button>}
    >
      {isLoading && <p className="text-sm text-muted-foreground">Apps laden…</p>}
      {error && <p className="text-sm text-destructive">{errorText(error, "Apps konden niet geladen worden.")}</p>}
      {data && data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Nog geen apps. Maak je eerste app aan.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((app) => (
            <div key={app.id} className="group relative rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/30">
              <Link to="/console/apps/$appId/credentials" params={{ appId: app.id }} className="absolute inset-0" aria-label={`Open ${app.name}`} />
              <div className="flex items-start gap-3">
                <AppLogo app={app} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{app.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{app.clientId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setToDelete(app)}
                  className="relative z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label={`Verwijder ${app.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                  {app.flowPreference === "strict" ? <ShieldCheck className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                  {app.flowPreference === "strict" ? "Strict" : "Seamless"}
                </span>
                {app.richIdentityEnabled && <span className="rounded-full border border-border px-2 py-0.5">Rich Identity</span>}
                <span className="rounded-full border border-border px-2 py-0.5">{app.redirectUris.length} redirect(s)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAppDialog open={creating} onOpenChange={setCreating} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toDelete?.name} verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Gebruikers kunnen daarna niet meer inloggen via deze app. Dit kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await remove({ data: { id: toDelete.id } });
                  await qc.invalidateQueries({ queryKey: APPS_KEY });
                  toast.success("App verwijderd");
                } catch (e) {
                  toast.error(errorText(e, "Verwijderen mislukt."));
                }
                setToDelete(null);
              }}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConsolePage>
  );
}

function CreateAppDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const save = useServerFn(saveOAuthClient);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState("");
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ appId: string; secret: string } | null>(null);

  const close = () => {
    onOpenChange(false);
    setName(""); setRedirect(""); setSecret(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader><DialogTitle>{secret ? "Bewaar je client secret" : "Nieuwe app"}</DialogTitle></DialogHeader>
        {secret ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Dit geheim wordt maar één keer getoond.</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
              <code className="flex-1 break-all text-xs">{secret.secret}</code>
              <button type="button" aria-label="Kopieer" onClick={() => { navigator.clipboard.writeText(secret.secret); toast.success("Gekopieerd"); }}>
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <DialogFooter>
              <Button onClick={() => { const id = secret.appId; close(); navigate({ to: "/console/apps/$appId/credentials", params: { appId: id } }); }}>
                Naar de app
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const res = (await save({
                  data: { name: name.trim(), redirectUris: [redirect.trim()], scopes: ["openid", "profile", "email"] },
                })) as { client: { id: string }; clientSecret: string | null };
                await qc.invalidateQueries({ queryKey: APPS_KEY });
                setSecret({ appId: res.client.id, secret: res.clientSecret ?? "" });
              } catch (err) {
                toast.error(errorText(err, "Aanmaken mislukt."));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input required maxLength={80} placeholder="Naam van je app" value={name} onChange={(e) => setName(e.target.value)} />
            <Input required type="url" placeholder="https://jouwapp.be/auth/callback" value={redirect} onChange={(e) => setRedirect(e.target.value)} />
            <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Bezig…" : "App aanmaken"}</Button></DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

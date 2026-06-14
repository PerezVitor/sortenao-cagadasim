import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Radio, Target, Trophy, Users } from "lucide-react";
import { Flag } from "@/components/app/Flag";
import { getLiveMatchPreview } from "@/lib/api/predictions.functions";

export const Route = createFileRoute("/_authenticated/ao-vivo")({
  component: LivePage,
});

function getPositionMovement(currentPosition: number | null, simulatedPosition: number) {
  if (currentPosition === null) {
    return { label: "—", className: "text-slate-500" };
  }

  const difference = currentPosition - simulatedPosition;
  if (difference > 0) {
    return {
      label: `↑ +${difference} ${difference === 1 ? "posição" : "posições"}`,
      className: "text-grass",
    };
  }
  if (difference < 0) {
    const positions = Math.abs(difference);
    return {
      label: `↓ -${positions} ${positions === 1 ? "posição" : "posições"}`,
      className: "text-victory",
    };
  }

  return { label: "—", className: "text-slate-500" };
}

function LivePage() {
  const loadLivePreview = useServerFn(getLiveMatchPreview);
  const [data, setData] = useState<Awaited<ReturnType<typeof getLiveMatchPreview>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLivePreview()
      .then(setData)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "N\u00e3o foi poss\u00edvel carregar o ao vivo.");
      });
  }, [loadLivePreview]);

  if (error) {
    return <div className="p-8 text-center text-sm uppercase tracking-widest text-victory">{error}</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-sm uppercase tracking-widest text-slate-500">Carregando ao vivo...</div>;
  }

  if (data.live_matches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-5xl uppercase italic mb-8">Ao Vivo</h1>
        <div className="bg-white/5 border border-white/10 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Nenhum jogo ao vivo agora</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="font-display text-5xl uppercase italic">Ao Vivo</h1>
      {data.live_matches.map((match) => (
        <section key={match.id} className="space-y-4">
          <div className="bg-white/5 border border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-victory">
                <Radio className="size-4" />
                <span className="text-xs font-black uppercase tracking-widest">Jogo em andamento</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                {new Date(match.kickoff_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <Flag
                showName
                flag={match.home?.flag}
                name={match.home?.name ?? match.home_placeholder}
                sigla={match.home?.sigla ?? match.home_placeholder}
              />
              <span className="font-display text-4xl sm:text-6xl">
                {match.home_score ?? "-"} x {match.away_score ?? "-"}
              </span>
              <Flag
                showName
                flag={match.away?.flag}
                name={match.away?.name ?? match.away_placeholder}
                sigla={match.away?.sigla ?? match.away_placeholder}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl uppercase italic mb-3">Palpites dos Participantes</h2>
              <div className="space-y-2">
                {match.participants.map((participant) => (
                  <div key={participant.id} className="bg-white/5 border border-white/10 p-4 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-bold uppercase ${participant.is_current_user ? "text-gold" : ""}`}>
                        {participant.nickname}
                        {participant.is_current_user ? " · Você" : ""}
                      </div>
                    </div>
                    <span className="font-display text-xl min-w-16 text-center">
                      {participant.prediction
                        ? `${participant.prediction.home_score} x ${participant.prediction.away_score}`
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1 font-display text-xl text-grass min-w-14 justify-end">
                      <Target className="size-3.5" /> +{participant.provisional_points}
                    </span>
                  </div>
                ))}
                {match.participants.length === 0 && (
                  <p className="bg-white/5 border border-white/10 p-6 text-center text-xs uppercase tracking-widest text-slate-500">
                    <Users className="size-4 inline-block mr-2" />
                    Nenhum participante
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl uppercase italic mb-3">🏆 Ranking Ao Vivo</h2>
              <div className="space-y-2">
                {[...match.provisional_ranking]
                  .sort((a, b) => a.simulated_position - b.simulated_position)
                  .map((participant) => {
                    const movement = getPositionMovement(
                      participant.current_position,
                      participant.simulated_position,
                    );

                    return (
                      <div
                        key={participant.id}
                        className={`border p-4 flex items-center gap-3 ${
                          participant.is_current_user
                            ? "border-gold/60 bg-gold/10 ring-1 ring-gold/20"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <span className="font-display text-2xl w-10 text-center">
                          {participant.simulated_position}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate text-sm font-bold uppercase ${
                              participant.is_current_user ? "text-gold" : ""
                            }`}
                          >
                            {participant.nickname}
                            {participant.is_current_user ? " · Você" : ""}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest">
                            <span className={movement.className}>{movement.label}</span>
                            <span className="text-slate-500">
                              Atual: {participant.current_position === null ? "—" : `${participant.current_position}º`}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">
                            {participant.total_points} pontos + {participant.provisional_gain} provisórios
                          </div>
                        </div>
                        <span className="flex items-center gap-1 font-display text-2xl text-grass">
                          <Trophy className="size-4" /> {participant.provisional_total_points}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

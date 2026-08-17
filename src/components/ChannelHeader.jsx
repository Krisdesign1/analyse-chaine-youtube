import { C, MONO } from "../theme";
import { compact, fmt } from "../lib/format";

export default function ChannelHeader({ channel, actions }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }} className="mt-10 pb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {channel.thumb && (
          <img src={channel.thumb} alt="" style={{ width: 44, height: 44 }} className="rounded-full" />
        )}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{channel.title}</div>
          <div style={{ fontFamily: MONO, color: C.muted, fontSize: 11 }}>
            {compact(channel.subs)} abonnés · {fmt(channel.videoCount)} vidéos · {compact(channel.totalViews)} vues
            cumulées
          </div>
        </div>
      </div>
      {actions}
    </div>
  );
}

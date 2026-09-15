type SwatchProps = {
  name: string;
  hex: string;
};

export function Swatch({ name, hex }: SwatchProps) {
  return (
    <div className="overflow-hidden rounded-md border border-white/[0.09]">
      <div className="h-[74px]" style={{ background: hex }} />
      <div className="px-3 py-2.5">
        <div className="text-sm font-bold text-moonlight">{name}</div>
        <div className="font-mono text-xs tabular-nums text-ash">{hex}</div>
      </div>
    </div>
  );
}

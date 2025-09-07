interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function TextInput({ value, onChange }: Props) {
  return (
    <section>
      <div className="space-y-2">
        <label className="text-sm font-medium">テキスト（フランス語）</label>
        <textarea
          className="w-full h-56 rounded-2xl border border-zinc-300 p-3"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ここにフランス語のテキストを貼り付けてください"
        />
      </div>
    </section>
  );
}

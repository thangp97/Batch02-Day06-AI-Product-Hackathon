export default function Disclaimer({ text }: { text: string | null }) {
  if (!text) return null
  return <p className="disclaimer">{text}</p>
}

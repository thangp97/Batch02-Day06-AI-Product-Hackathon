export default function Disclaimer({ text }: { text: string }) {
  return (
    <p className="text-xs mt-2 text-center italic" style={{ color: "rgba(224,240,255,0.28)" }}>
      {text}
    </p>
  )
}

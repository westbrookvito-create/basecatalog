export default function Banner({ text }) {
  if (!text) return null;
  return <div className="banner">{text}</div>;
}

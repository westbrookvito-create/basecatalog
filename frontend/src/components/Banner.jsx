export default function Banner({ image }) {
  if (!image) return null;
  return (
    <div className="banner">
      <img className="banner__image" src={image} alt="" />
    </div>
  );
}

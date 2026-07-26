import Image from "next/image";

export default function CatalogImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const image = src || "/images/projects/campo-belo/campo-belo-1.jpg";
  return (
    <Image
      src={image}
      alt={alt}
      fill
      priority={priority}
      unoptimized={image.startsWith("http")}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={className}
    />
  );
}

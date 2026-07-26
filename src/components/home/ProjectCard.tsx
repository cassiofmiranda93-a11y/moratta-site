import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";

interface ProjectCardProps {
  image: string;
  title: string;
  city: string;
  description: string;
}

export default function ProjectCard({
  image,
  title,
  city,
  description,
}: ProjectCardProps) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <div className="relative h-60 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-110"
        />
      </div>

      <div className="space-y-4 p-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={16} />
          {city}
        </div>

        <p className="leading-7 text-gray-600">
          {description}
        </p>

        <button className="flex items-center gap-2 font-semibold text-blue-900 transition hover:gap-3">
          Ver empreendimento
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
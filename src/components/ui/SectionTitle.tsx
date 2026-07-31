interface SectionTitleProps {
  title: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionTitle({
  title,
  subtitle,
  center = true,
}: SectionTitleProps) {
  return (
    <div className={center ? "text-center" : ""}>
      <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-slate-950 md:text-4xl">
        {title}
      </h2>

      {subtitle && (
        <p className={`${center ? "mx-auto" : ""} mt-4 max-w-3xl text-lg leading-8 text-slate-600`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

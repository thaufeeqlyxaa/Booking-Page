'use client';

type SectionHeadingProps = {
  order: string;
  title: string;
  description?: string;
};

export function SectionHeading({ order, title, description }: SectionHeadingProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.5em] text-mist">Step {order}</p>
      <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{title}</h2>
      {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/75">{description}</p> : null}
    </div>
  );
}

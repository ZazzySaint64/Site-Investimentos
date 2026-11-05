import Image from "next/image";
import type { Plate } from "@/lib/plates";

/**
 * A whole plate on a paper mat, so no drawing ever touches an edge. Printed image, never cropped.
 * The arch's top padding keeps the print's corners inside the curve (radius 30% of the width).
 */
export function PlateFrame({
  plate,
  alt,
  sizes,
  arch = false,
  priority = false,
  className = "",
}: {
  plate: Plate;
  alt: string;
  sizes: string;
  arch?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const shape = arch ? "rounded-tl-[30%_22%] rounded-tr-[30%_22%] rounded-b-lg px-[7%] pt-[15%] pb-[7%]" : "rounded-lg p-3 sm:p-4";
  return (
    <div className={`bg-paper ${shape} ${className}`}>
      <div className="overflow-hidden rounded-md">
        <Image
          src={plate.src}
          width={plate.width}
          height={plate.height}
          sizes={sizes}
          priority={priority}
          alt={alt}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

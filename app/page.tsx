import Image from "next/image";
import { KudosBadge, KudosButtonLink, Sparkle } from "@/components/KudosUI";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <Sparkle className="pointer-events-none animate-kudos-float absolute left-[12%] top-[18%] text-2xl opacity-50" />
      <Sparkle className="pointer-events-none animate-kudos-float absolute bottom-[17%] right-[14%] text-xl text-kudos-sun opacity-60 [animation-delay:-1.8s]" />

      <div className="animate-kudos-pop-in flex w-full max-w-md flex-col items-center">
        <KudosBadge tone="purple">A little progress, every day</KudosBadge>
        <div className="pointer-events-none relative -my-14 h-60 w-full max-w-sm overflow-hidden sm:-my-12">
          <Image
            src="/logo.jpeg"
            alt="Kudos"
            fill
            priority
            sizes="(max-width: 640px) 90vw, 384px"
            className="object-cover mix-blend-multiply"
          />
        </div>
        <div className="relative z-10 mt-5 flex w-full max-w-xs flex-col gap-3">
          <KudosButtonLink href="/play/login" size="lg" className="w-full">
            View the family board
            <span aria-hidden="true">→</span>
          </KudosButtonLink>
          <KudosButtonLink href="/gm/login" variant="secondary" size="lg" className="w-full">
            Gamemaster
          </KudosButtonLink>
        </div>
      </div>
    </main>
  );
}

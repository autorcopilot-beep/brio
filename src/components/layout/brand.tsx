import Image from "next/image";
import Link from "next/link";
export function Brand({ compact=false }: { compact?:boolean }) { return <Link href="/" className="inline-flex items-center gap-2" aria-label="Brio, início"><Image src="/brand/brio-mark-gradient.svg" alt="" width={29} height={29} priority />{!compact && <span className="text-xl font-bold tracking-tight">brio</span>}</Link>; }
